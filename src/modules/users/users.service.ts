import type { I18nTranslations } from '@types';

import { join } from 'path';

import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { compareSync, hashSync } from 'bcrypt';
import { I18nContext, I18nService } from 'nestjs-i18n';

import { Errors } from '@i18n';
import { UserPostByAdminDTO, UserPostDTO } from '@modules/auth/dto/register.dto';
import { EmailsService } from '@modules/emails/emails.service';
import { FilesService } from '@modules/files/files.service';
import { UserBanner } from '@modules/users/entities/user-banner.entity';
import { UserPicture } from '@modules/users/entities/user-picture.entity';
import { UserVisibility } from '@modules/users/entities/user-visibility.entity';
import { User } from '@modules/users/entities/user.entity';
import { checkBirthDate } from '@utils/dates';
import { checkPasswordStrength, generateRandomPassword } from '@utils/password';
import { getTemplate } from '@utils/template';

import { BaseUserResponseDTO } from './dto/base-user.dto';
import { UserPatchDTO } from './dto/patch.dto';

@Injectable()
export class UsersService {
	constructor(
		private readonly orm: MikroORM,
		private readonly i18n: I18nService<I18nTranslations>,
		private readonly filesService: FilesService,
		private readonly emailsService: EmailsService,
		private readonly configService: ConfigService,
	) {}

	/**
	 * Check for user that are not verified and which their verification period is older than 7 days
	 * If found, delete them
	 * Runs every 10 minutes
	 */
	@Cron('0 */10 * * * *')
	@UseRequestContext()
	async deleteUnverifiedUsers() {
		const users = await this.orm.em.find(User, {
			email_verified: false,
			created_at: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
		});

		for (const user of users) {
			await this.delete(user.id);
		}
	}

	/**
	 * Remove fields that the user as set to private
	 * @param {User[]} users The users to filter
	 * @returns {Promise<Partial<User>[]>} The filtered users
	 */
	@UseRequestContext()
	async removePrivateFields(users: User[]): Promise<Partial<User>[]> {
		const res: Partial<User>[] = [];

		const visibilities = await this.findVisibilities(users.map((u) => u.id));
		visibilities.forEach((v) => {
			const user = users.find((u) => u.id === v.user.id);

			Object.entries(v).forEach(([key, value]) => {
				// TODO - Find a better alternative (which should be type safe & easy to maintain)
				// @ts-ignore
				if (value === false) user[key] = undefined;
			});

			res.push(user);
		});

		return res;
	}

	/**
	 * Keep only the base fields of a user
	 * @param {User[]} users the users to filter
	 * @returns {BaseUserResponseDTO[]} The "filtered" users
	 */
	asBaseUsers(users: User[]): BaseUserResponseDTO[] {
		const res: BaseUserResponseDTO[] = [];
		for (const user of users.sort((a, b) => a.id - b.id)) {
			res.push({
				id: user.id,
				updated_at: user.updated_at,
				created_at: user.created_at,
				first_name: user.first_name,
				last_name: user.last_name,
				nickname: user.nickname,
			});
		}

		return res;
	}

	/**
	 * Find a user by id or email and return it
	 * @param {Partial<Pick<User, 'id' | 'email'>>} param0 The id or email of the user to find
	 * @param {boolean} filter Whether to filter the user or not (default: true)
	 *
	 * @returns {Promise<User | Partial<User>>} The user found (partial if filter is true)
	 * @throws {BadRequestException} If no id or email is provided
	 * @throws {NotFoundException} If no user is found with the provided id/email
	 *
	 * @example
	 * ```ts
	 * const user1: User = await this.usersService.findOne({ id: 1 }, false);
	 * const user2: Partial<User> = await this.usersService.findOne({ email: 'example@domain.com' });
	 * ```
	 */
	async findOne({ id, email }: Partial<Pick<User, 'id' | 'email'>>, filter: false): Promise<User>;
	async findOne({ id, email }: Partial<Pick<User, 'id' | 'email'>>): Promise<Partial<User>>;

	@UseRequestContext()
	async findOne({ id, email }: Partial<Pick<User, 'id' | 'email'>>, filter = true): Promise<User | Partial<User>> {
		let user: User = null;

		if (id) user = await this.orm.em.findOne(User, { id });
		if (email) user = await this.orm.em.findOne(User, { email });

		if (!id && !email) throw new BadRequestException(Errors.Generic.IdOrEmailMissing({ i18n: this.i18n, type: User }));
		if (!user && id) throw new NotFoundException(Errors.Generic.IdNotFound({ i18n: this.i18n, type: User, id }));
		if (!user && email) throw new NotFoundException(Errors.Email.NotFound({ i18n: this.i18n, type: User, email }));

		return filter ? (await this.removePrivateFields([user]))[0] : user;
	}

	/**
	 * Return the visibility parameters of a user
	 * @param {number} ids The ids of the users
	 * @returns {Promise<UserVisibility[]>} The visibility parameters of each user
	 */
	@UseRequestContext()
	async findVisibilities(ids: number[] | number): Promise<UserVisibility[]> {
		if (typeof ids === 'number') ids = [ids];

		const users = await this.orm.em.find(User, { id: { $in: ids } });
		if (!users)
			throw new NotFoundException(Errors.Generic.IdNotFound({ i18n: this.i18n, type: User, id: ids.toString() }));

		return await this.orm.em.find(UserVisibility, { user: { $in: users } });
	}

	async findAll(filter: false): Promise<User[]>;
	async findAll(filter: true): Promise<Partial<User>[]>;

	@UseRequestContext()
	async findAll(filter = true): Promise<User[] | Partial<User>[]> {
		const users = await this.orm.em.find(User, {});
		if (filter) return this.removePrivateFields(users);

		return users;
	}

	@UseRequestContext()
	async register(input: UserPostDTO): Promise<User> {
		Object.entries(input).forEach(([key, value]) => {
			if (typeof value === 'string') {
				// @ts-ignore
				input[key] = value.trim();
			}
		});

		this.emailsService.validateEmail(input.email);

		if (await this.orm.em.findOne(User, { email: input.email }))
			throw new BadRequestException(Errors.Email.AlreadyUsed({ i18n: this.i18n, email: input.email }));

		if (!checkBirthDate(input.birth_date))
			throw new BadRequestException(Errors.BirthDate.Invalid({ i18n: this.i18n, date: input.birth_date }));

		if (!checkPasswordStrength(input.password))
			throw new BadRequestException(Errors.Password.Weak({ i18n: this.i18n }));

		// Check if the password is already hashed
		if (input.password.length !== 60) input.password = hashSync(input.password, 10);

		// Add the email verification token & create the user
		const email_token = generateRandomPassword(12);
		const user = this.orm.em.create(User, {
			...input,
			email_verification: hashSync(email_token, 10),
		});

		// Save changes to the database & create the user's visibility parameters
		this.orm.em.create(UserVisibility, { user });
		await this.orm.em.persistAndFlush(user);

		// Fetch the user again to get the id
		const registered = await this.orm.em.findOne(User, { email: input.email });

		await this.emailsService.sendEmail({
			to: [registered.email],
			subject: this.i18n.t('templates.register_common.subject', { lang: I18nContext.current().lang }),
			html: getTemplate('emails/register_user', this.i18n, {
				username: registered.full_name,
				link: this.configService.get<boolean>('production')
					? `${this.configService.get<string>('production_url')}/auth/confirm/${registered.id}/${encodeURI(
							email_token,
					  )}/redirect`
					: `http://localhost:${this.configService.get<string>('port')}/auth/confirm/${registered.id}/${encodeURI(
							email_token,
					  )}`,
				days: this.configService.get<number>('email.token_validity'),
			}),
		});

		return user;
	}

	@UseRequestContext()
	async registerByAdmin(input: UserPostByAdminDTO): Promise<User> {
		if (await this.orm.em.findOne(User, { email: input.email }))
			throw new BadRequestException(Errors.Email.AlreadyUsed({ i18n: this.i18n, email: input.email }));

		this.emailsService.validateEmail(input.email);

		if (!checkBirthDate(input.birth_date))
			throw new BadRequestException(Errors.BirthDate.Invalid({ i18n: this.i18n, date: input.birth_date }));

		// Generate a random password & hash it
		const password = generateRandomPassword(12);
		const user = this.orm.em.create(User, { ...input, password: hashSync(password, 10), email_verified: true });
		this.orm.em.create(UserVisibility, { user });

		await this.emailsService.sendEmail({
			to: [user.email],
			subject: this.i18n.t('templates.register_common.subject', { lang: I18nContext.current().lang }),
			html: getTemplate('emails/register_user_by_admin', this.i18n, {
				username: user.full_name,
				password,
			}),
		});

		await this.orm.em.persistAndFlush(user);
		return user;
	}

	@UseRequestContext()
	async verifyEmail(user_id: number, token: string): Promise<User> {
		if (!user_id || !token) throw new BadRequestException('Missing user id or token');

		const user = await this.orm.em.findOne(User, { id: user_id });
		if (!user) throw new NotFoundException(Errors.Generic.IdNotFound({ i18n: this.i18n, type: User, id: user_id }));

		if (user.email_verified)
			throw new BadRequestException(Errors.Email.AlreadyVerified({ i18n: this.i18n, type: User }));

		if (!compareSync(token, user.email_verification))
			throw new UnauthorizedException(Errors.Email.InvalidVerificationToken({ i18n: this.i18n }));

		user.email_verified = true;
		user.email_verification = null;

		await this.orm.em.persistAndFlush(user);
		return user;
	}

	@UseRequestContext()
	async update(requestUserId: number, input: UserPatchDTO) {
		const user = await this.findOne({ id: input.id }, false);

		if (!user) throw new NotFoundException(`User with id ${input.id} not found`);

		if (input.email) this.emailsService.validateEmail(input.email);

		if (input.hasOwnProperty('birth_date') || input.hasOwnProperty('first_name') || input.hasOwnProperty('last_name')) {
			const currentUser = await this.findOne({ id: requestUserId }, false);

			if (currentUser.id === user.id)
				//FIXME - No I18n here ?
				throw new UnauthorizedException(
					'You cannot update your own birth date / first (or last) name, ask another user with the appropriate permission',
				);
		}

		Object.assign(user, input);

		await this.orm.em.persistAndFlush(user);
		return user;
	}

	@UseRequestContext()
	async updatePicture(id: number, file: Express.Multer.File): Promise<User> {
		const user = await this.orm.em.findOne(User, { id }, { populate: ['picture'] });
		if (!user) throw new NotFoundException(Errors.Generic.IdNotFound({ type: User, id, i18n: this.i18n }));

		const fileInfos = await this.filesService.writeOnDiskAsImage(file, {
			directory: join(this.configService.get<string>('files.users'), 'pictures'),
			filename: user.full_name.replaceAll(' ', '_'),
			aspectRatio: '1:1',
		});

		// Remove old file if present
		if (user.picture) {
			this.filesService.deleteFromDisk(user.picture);

			user.picture.filename = fileInfos.filename;
			user.picture.mimetype = fileInfos.mimetype;
			user.picture.description = `Picture of ${user.full_name}`;
			user.picture.path = fileInfos.filepath;
			user.picture.size = fileInfos.size;

			await this.orm.em.persistAndFlush(user.picture);
		} else
			user.picture = this.orm.em.create(UserPicture, {
				filename: fileInfos.filename,
				mimetype: fileInfos.mimetype,
				description: `Picture of ${user.full_name}`,
				path: fileInfos.filepath,
				picture_user: user,
				size: fileInfos.size,
				visibility: await this.filesService.getVisibilityGroup(),
			});

		await this.orm.em.persistAndFlush(user);

		delete user.picture.picture_user; // avoid circular reference
		return user;
	}

	@UseRequestContext()
	async getPicture(id: number): Promise<UserPicture> {
		const user = await this.orm.em.findOneOrFail(User, { id }, { populate: ['picture'] });
		if (!user.picture) throw new NotFoundException('User has no picture');
		return user.picture;
	}

	@UseRequestContext()
	async deletePicture(id: number): Promise<void> {
		const user = await this.orm.em.findOneOrFail(User, { id }, { populate: ['picture'] });
		if (!user.picture) throw new NotFoundException('User has no picture to be deleted');

		this.filesService.deleteFromDisk(user.picture);
		await this.orm.em.removeAndFlush(user.picture);
	}

	@UseRequestContext()
	async updateBanner(id: number, file: Express.Multer.File): Promise<User> {
		const user = await this.orm.em.findOne(User, { id }, { populate: ['banner'] });
		if (!user) throw new NotFoundException(Errors.Generic.IdNotFound({ type: User, id, i18n: this.i18n }));

		const fileInfos = await this.filesService.writeOnDiskAsImage(file, {
			directory: join(this.configService.get<string>('files.users'), 'banners'),
			filename: user.full_name.replaceAll(' ', '_'),
			aspectRatio: '16:9',
		});

		// Remove old file if present
		if (user.banner) {
			this.filesService.deleteFromDisk(user.banner);

			user.banner.filename = fileInfos.filename;
			user.banner.mimetype = fileInfos.mimetype;
			user.banner.description = `Banner of ${user.full_name}`;
			user.banner.path = fileInfos.filepath;
			user.banner.size = fileInfos.size;

			await this.orm.em.persistAndFlush(user.banner);
		} else
			user.banner = this.orm.em.create(UserBanner, {
				filename: fileInfos.filename,
				mimetype: fileInfos.mimetype,
				description: `Banner of ${user.full_name}`,
				path: fileInfos.filepath,
				banner_user: user,
				size: fileInfos.size,
				visibility: await this.filesService.getVisibilityGroup(),
			});

		await this.orm.em.persistAndFlush(user);

		delete user.banner.banner_user; // avoid circular reference
		return user;
	}

	@UseRequestContext()
	async getBanner(id: number): Promise<UserBanner> {
		const user = await this.orm.em.findOneOrFail(User, { id }, { populate: ['banner'] });
		if (!user.banner) throw new NotFoundException('User has no banner');
		return user.banner;
	}

	@UseRequestContext()
	async deleteBanner(id: number): Promise<void> {
		const user = await this.orm.em.findOneOrFail(User, { id }, { populate: ['banner'] });
		if (!user.banner) throw new NotFoundException('User has no banner to be deleted');

		this.filesService.deleteFromDisk(user.banner);
		await this.orm.em.removeAndFlush(user.banner);
	}

	@UseRequestContext()
	async delete(id: number) {
		const user = await this.orm.em.findOne(User, { id });
		await this.orm.em.removeAndFlush(user);
	}

	@UseRequestContext()
	async getUserRoles(id: number, input: { show_expired: boolean; show_revoked: boolean }) {
		const user = await this.orm.em.findOneOrFail(User, { id }, { populate: ['roles'] });
		const roles = user.roles.getItems();

		if (!input.show_expired) roles.filter((p) => p.expires > new Date());
		if (!input.show_revoked) roles.filter((p) => p.revoked === false);

		return roles;
	}

	@UseRequestContext()
	async getUserPermissions(id: number, input: { show_expired: boolean; show_revoked: boolean }) {
		const user = await this.orm.em.findOneOrFail(User, { id }, { populate: ['permissions'] });
		const permissions = user.permissions.getItems();

		if (!input.show_expired) permissions.filter((p) => p.expires > new Date());
		if (!input.show_revoked) permissions.filter((p) => p.revoked === false);

		return permissions;
	}
}

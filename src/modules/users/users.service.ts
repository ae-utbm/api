import type { I18nTranslations } from '@types';

import fs from 'fs';
import path from 'path';

import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { compareSync, hashSync } from 'bcrypt';
import { I18nContext, I18nService } from 'nestjs-i18n';

import { UserPostByAdminDTO, UserPostDTO } from '@modules/auth/dto/register.dto';
import { UserBanner } from '@modules/users/entities/user-banner.entity';
import { UserPicture } from '@modules/users/entities/user-picture.entity';
import { UserVisibility } from '@modules/users/entities/user-visibility.entity';
import { User } from '@modules/users/entities/user.entity';
import { checkBirthday } from '@utils/dates';
import { checkEmail, sendEmail } from '@utils/email';
import { convertToWebp, isBannerAspectRation, isSquare } from '@utils/images';
import { generateRandomPassword } from '@utils/password';
import {
	birthdayInvalid,
	emailAlreadyUsed,
	emailAlreadyVerified,
	emailInvalid,
	emailInvalidToken,
	emailNotFound,
	idInvalid,
	idNotFound,
	idOrEmailMissing,
} from '@utils/responses';
import { getTemplate } from '@utils/template';
import { validateObject } from '@utils/validate';

import { UserPatchDTO } from './dto/patch.dto';

@Injectable()
export class UsersService {
	constructor(
		private readonly i18n: I18nService<I18nTranslations>,
		private readonly configService: ConfigService,
		private readonly orm: MikroORM,
	) {}

	/**
	 * Check for user that are not verified and which their verification period is older than 7 days
	 * If found, delete them
	 * Runs every 10 minutes
	 */
	@Cron('0 */10 * * * *')
	@UseRequestContext()
	async checkForUnverifiedUsers() {
		const users = await this.orm.em.find(User, {
			email_verified: false,
			created_at: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
		});

		for (const user of users) {
			await this.delete(user.id);
		}
	}

	@UseRequestContext()
	public async checkVisibility(user: User): Promise<Partial<User>> {
		const visibility = await this.orm.em.findOneOrFail(UserVisibility, { user });

		Object.entries(visibility).forEach(([key, value]) => {
			// @ts-ignore
			if (value === false) user[key] = undefined;
		});

		return user;
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

		if (!id && !email) throw new BadRequestException(idOrEmailMissing({ i18n: this.i18n, type: User }));
		if (!user && id) throw new NotFoundException(idNotFound({ i18n: this.i18n, type: User, id }));
		if (!user && email) throw new NotFoundException(emailNotFound({ i18n: this.i18n, type: User, email }));

		return filter ? await this.checkVisibility(user) : user;
	}

	@UseRequestContext()
	async findVisibility({ id }: Partial<Pick<User, 'id'>>): Promise<UserVisibility> {
		const user = await this.orm.em.findOne(User, { id });
		if (!user) throw new NotFoundException(idNotFound({ i18n: this.i18n, type: User, id }));

		return await this.orm.em.findOne(UserVisibility, { user });
	}

	@UseRequestContext()
	async findAll(filter = true) {
		const users = await this.orm.em.find(User, {});
		if (filter) return users.map(async (user) => await this.checkVisibility(user));

		return users;
	}

	@UseRequestContext()
	async register(input: UserPostDTO): Promise<User> {
		validateObject({
			object: input,
			type: UserPostDTO,
			requiredKeys: ['password', 'first_name', 'last_name', 'email', 'birthday'],
			i18n: this.i18n,
		});

		Object.entries(input).forEach(([key, value]) => {
			if (typeof value === 'string') {
				// @ts-ignore
				input[key] = value.trim();
			}
		});

		if (!checkEmail(input.email)) throw new BadRequestException(emailInvalid({ i18n: this.i18n, email: input.email }));

		if (!checkBirthday(input.birthday))
			throw new BadRequestException(birthdayInvalid({ i18n: this.i18n, date: input.birthday }));

		if (await this.orm.em.findOne(User, { email: input.email }))
			throw new BadRequestException(emailAlreadyUsed({ i18n: this.i18n, email: input.email }));

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

		await sendEmail({
			to: [registered.email],
			subject: this.i18n.t('templates.register_common.subject', { lang: I18nContext.current().lang }),
			html: getTemplate('emails/register_user', this.i18n, {
				username: registered.full_name,
				link: this.configService.get<boolean>('production')
					? `https://ae.utbm.fr/api/auth/confirm/${registered.id}/${encodeURI(email_token)}/${encodeURI(
							'https://ae.utbm.fr',
					  )}`
					: `http://localhost:${this.configService.get<string>('port')}/api/auth/confirm/${registered.id}/${encodeURI(
							email_token,
					  )}`,
				days: 7,
			}),
		});

		return user;
	}

	@UseRequestContext()
	async verifyEmail(user_id: number, token: string): Promise<User> {
		if (!user_id || !token) throw new BadRequestException('Missing user id or token');

		if (typeof user_id === 'string' && parseInt(user_id, 10) != user_id)
			throw new BadRequestException(idInvalid({ i18n: this.i18n, type: User, id: user_id }));

		const user = await this.orm.em.findOne(User, { id: user_id });
		if (!user) throw new NotFoundException(idNotFound({ i18n: this.i18n, type: User, id: user_id }));

		if (user.email_verified) throw new BadRequestException(emailAlreadyVerified({ i18n: this.i18n, type: User }));

		if (!compareSync(token, user.email_verification))
			throw new UnauthorizedException(emailInvalidToken({ i18n: this.i18n }));

		user.email_verified = true;
		user.email_verification = null;

		await this.orm.em.persistAndFlush(user);
		return user;
	}

	@UseRequestContext()
	async registerByAdmin(input: UserPostByAdminDTO): Promise<User> {
		if (await this.orm.em.findOne(User, { email: input.email }))
			throw new BadRequestException(`User already with the email '${input.email}' already exists`);

		if (!checkEmail(input.email)) throw new BadRequestException(emailInvalid({ i18n: this.i18n, email: input.email }));

		if (!checkBirthday(input.birthday))
			throw new BadRequestException(birthdayInvalid({ i18n: this.i18n, date: input.birthday }));

		// Generate a random password & hash it
		const password = generateRandomPassword(12);
		const user = this.orm.em.create(User, { ...input, password: hashSync(password, 10), email_verified: true });
		this.orm.em.create(UserVisibility, { user });

		await sendEmail({
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
	async update(requestUserId: number, input: UserPatchDTO) {
		const user = await this.findOne({ id: input.id }, false);

		if (!user) throw new NotFoundException(`User with id ${input.id} not found`);

		if (input.email && !checkEmail(input.email))
			throw new BadRequestException(emailInvalid({ i18n: this.i18n, email: input.email }));

		if (input.hasOwnProperty('birthday') || input.hasOwnProperty('first_name') || input.hasOwnProperty('last_name')) {
			const currentUser = await this.findOne({ id: requestUserId }, false);

			if (currentUser.id === user.id)
				throw new UnauthorizedException(
					'You cannot update your own birthday / first (or last) name, ask another user with the appropriate permission',
				);
		}

		Object.assign(user, input);

		await this.orm.em.persistAndFlush(user);
		return user;
	}

	@UseRequestContext()
	async updatePicture({ id, file }: { id: number; file: Express.Multer.File }) {
		const user = await this.orm.em.findOneOrFail(User, { id }, { fields: ['*', 'picture'] });

		// TODO: add a check to autorise the user to change his picture if he has the associated permission
		// -> the user needs to be the one sending the request, not the one targeted by the request
		if (
			user.picture &&
			0 <
				this.configService.get<number>('files.usersPicturesDelay') * 1000 -
					(new Date().getTime() - new Date(user.picture.updated_at).getTime())
		)
			throw new UnauthorizedException('You can only change your picture once a week');

		const { buffer, mimetype } = file;
		const imageDir = path.join(this.configService.get<string>('files.users'), 'pictures');
		const extension = mimetype.replace('image/', '.');
		const filename = `${user.id}${extension}`;
		const imagePath = path.join(imageDir, filename);

		// write the file
		fs.mkdirSync(imageDir, { recursive: true });
		fs.writeFileSync(imagePath, buffer);

		// test if the image is square
		if (!(await isSquare(imagePath))) {
			fs.rmSync(imagePath);
			throw new BadRequestException('The user picture must be square');
		}

		// remove the old picture (if any)
		if (user.picture && user.picture.path && user.picture.path !== imagePath) fs.rmSync(user.picture.path);

		// convert to webp
		fs.createWriteStream(await convertToWebp(imagePath));

		// update database
		if (!user.picture)
			user.picture = this.orm.em.create(UserPicture, {
				filename,
				mimetype,
				path: imagePath.replace(extension, '.webp'),
				user,
			});
		else {
			user.picture.filename = filename;
			user.picture.mimetype = 'image/webp';
			user.picture.updated_at = new Date();
			user.picture.path = imagePath.replace(extension, '.webp');
		}

		await this.orm.em.persistAndFlush(user);
	}

	@UseRequestContext()
	async getPicture(id: number): Promise<UserPicture> {
		const user = await this.orm.em.findOneOrFail(User, { id }, { fields: ['picture'] });
		if (!user.picture) throw new NotFoundException('User has no picture');
		return user.picture;
	}

	@UseRequestContext()
	async deletePicture(id: number): Promise<void> {
		const user = await this.orm.em.findOneOrFail(User, { id }, { fields: ['picture'] });
		if (!user.picture) throw new NotFoundException('User has no picture to be deleted');

		fs.rmSync(user.picture.path);
		await this.orm.em.removeAndFlush(user.picture);
	}

	@UseRequestContext()
	async updateBanner({ id, file }: { id: number; file: Express.Multer.File }) {
		const user = await this.orm.em.findOneOrFail(User, { id }, { fields: ['*', 'banner'] });

		const { buffer, mimetype } = file;
		const imageDir = path.join(this.configService.get<string>('files.users'), 'banners');
		const extension = mimetype.replace('image/', '.');
		const filename = `${user.id}${extension}`;
		const imagePath = path.join(imageDir, filename);

		// write the file
		fs.mkdirSync(imageDir, { recursive: true });
		fs.writeFileSync(imagePath, buffer);

		// test if the image is square
		if (!(await isBannerAspectRation(imagePath))) {
			fs.rmSync(imagePath);
			throw new BadRequestException('The image must be of 1:3 aspect ratio');
		}

		// remove old banner if path differs
		if (user.banner && user.banner.path && user.banner.path !== imagePath) fs.rmSync(user.banner.path);

		// convert to webp
		fs.createWriteStream(await convertToWebp(imagePath));

		// update database
		if (!user.banner)
			user.banner = this.orm.em.create(UserBanner, {
				filename,
				mimetype,
				path: imagePath.replace(extension, '.webp'),
				user,
			});
		else {
			user.banner.filename = filename;
			user.banner.mimetype = 'image/webp';
			user.banner.path = imagePath.replace(extension, '.webp');
		}

		await this.orm.em.persistAndFlush(user);
	}

	@UseRequestContext()
	async getBanner(id: number): Promise<UserBanner> {
		const user = await this.orm.em.findOneOrFail(User, { id }, { fields: ['banner'] });
		if (!user.banner) throw new NotFoundException('User has no banner');

		return user.banner;
	}

	@UseRequestContext()
	async deleteBanner(id: number): Promise<void> {
		const user = await this.orm.em.findOneOrFail(User, { id }, { fields: ['banner'] });
		if (!user.banner) throw new NotFoundException('User has no banner to be deleted');

		fs.rmSync(user.banner.path);
		await this.orm.em.removeAndFlush(user.banner);
	}

	@UseRequestContext()
	async delete(id: number) {
		const user = await this.orm.em.findOne(User, { id });
		await this.orm.em.removeAndFlush(user);
	}

	@UseRequestContext()
	async getUserRoles(id: number, input: { show_expired: boolean; show_revoked: boolean }) {
		const user = await this.orm.em.findOneOrFail(User, { id }, { fields: ['roles'] });
		const roles = user.roles.getItems();

		if (!input.show_expired) roles.filter((p) => p.expires > new Date());
		if (!input.show_revoked) roles.filter((p) => p.revoked === false);

		return roles;
	}
}

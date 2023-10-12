import type { KeysOf, email } from '#types';
import type { I18nTranslations } from '#types/api';

import { MikroORM, CreateRequestContext } from '@mikro-orm/core';
import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { compareSync, hashSync } from 'bcrypt';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { z } from 'zod';

import { UserPostByAdminDTO, UserPostDTO } from '@modules/auth/dto/register.dto';
import { EmailsService } from '@modules/emails/emails.service';
import { Permission } from '@modules/permissions/entities/permission.entity';
import { RoleExpiration } from '@modules/roles/entities/role-expiration.entity';
import { TranslateService } from '@modules/translate/translate.service';
import { UserVisibility } from '@modules/users/entities/user-visibility.entity';
import { User, UserPrivate, UserPublic } from '@modules/users/entities/user.entity';
import { checkBirthDate } from '@utils/dates';
import { checkPasswordStrength, generateRandomPassword } from '@utils/password';
import { getTemplate } from '@utils/template';

import { BaseUserResponseDTO } from '../dto/base-user.dto';
import { UserRolesGetDTO } from '../dto/get.dto';
import { UserPatchDTO, UserVisibilityPatchDTO } from '../dto/patch.dto';

@Injectable()
export class UsersDataService {
	constructor(
		private readonly t: TranslateService,
		private readonly orm: MikroORM,
		private readonly i18n: I18nService<I18nTranslations>,
		private readonly emailsService: EmailsService,
		private readonly configService: ConfigService,
	) {}

	/**
	 * Check for user that are not verified and which their verification period is older than 7 days
	 * If found, delete them
	 * Runs every 10 minutes
	 */
	@Cron('0 */10 * * * *')
	@CreateRequestContext()
	async deleteUnverifiedUsers() {
		const users = await this.orm.em.find(User, {
			verified: null,
			created: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
		});

		for (const user of users) {
			await this.delete(user.id);
		}
	}

	/**
	 * Remove fields that the user as set to private
	 * @param {User[]} users The users to filter
	 * @returns {Promise<UserPublic[]>} The filtered users
	 */
	@CreateRequestContext()
	async removePrivateFields(users: User[]): Promise<UserPublic[]> {
		const res: UserPublic[] = [];

		const visibilities = await this.findVisibilities(users.map((u) => u.id));
		visibilities.forEach((v) => {
			const user = users.find((u) => u.id === v.user.id);

			Object.entries(v).forEach(([key, value]) => {
				// FIXME: Element implicitly has an 'any' type because expression of type 'string'
				//        can't be used to index type 'User'.
				// -> one solution is to use user[key as keyof User], but does not work because of
				//    the getters of User
				// @ts-ignore
				if (value === false) user[key] = undefined;
			});

			const privateFields: KeysOf<User> = ['files_visibility_groups', 'logs', 'roles', 'permissions'];
			privateFields.forEach((key) => {
				if (user[key]) delete user[key];
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
				updated: user.updated,
				created: user.created,
				first_name: user.first_name,
				last_name: user.last_name,
				nickname: user.nickname,
			});
		}

		return res;
	}

	/**
	 * Find a user by id or email and return it
	 * @param {Partial<number | email>} id_or_email The id or email of the user to find
	 * @param {boolean} filter Whether to filter the user or not (default: true)
	 *
	 * @returns {Promise<UserPrivate | UserPublic>} The user found (public if filter is true)
	 * @throws {BadRequestException} If no id or email is provided
	 * @throws {NotFoundException} If no user is found with the provided id/email
	 *
	 * @example
	 * ```ts
	 * const user1: UserPrivate = await this.usersService.findOne({ id: 1 }, false);
	 * const user2: UserPublic = await this.usersService.findOne({ email: 'example@domain.com' });
	 * ```
	 */
	async findOne(id_or_email: number | email, filter: false): Promise<UserPrivate>;
	async findOne(id_or_email: number | email): Promise<UserPublic>;

	@CreateRequestContext()
	async findOne(id_or_email: number | email, filter = true): Promise<UserPrivate | UserPublic> {
		let user: User = null;
		const parsed = z.union([z.coerce.number(), z.string().email()]).parse(id_or_email);

		if (typeof parsed === 'number') user = await this.orm.em.findOne(User, { id: parsed });
		else if (typeof parsed === 'string') user = await this.orm.em.findOne(User, { email: parsed as email });

		if (!user && typeof parsed === 'number') throw new NotFoundException(this.t.Errors.Id.NotFound(User, parsed));
		if (!user && typeof parsed === 'string')
			throw new NotFoundException(this.t.Errors.Email.NotFound(User, parsed as email));

		return filter ? (await this.removePrivateFields([user]))[0] : user;
	}

	/**
	 * Return the visibility parameters of a user
	 * @param {number} ids The ids of the users
	 * @returns {Promise<UserVisibility[]>} The visibility parameters of each user
	 */
	@CreateRequestContext()
	async findVisibilities(ids: number[] | number): Promise<UserVisibility[]> {
		if (!Array.isArray(ids)) ids = [ids];

		const users = await this.orm.em.find(User, { id: { $in: ids } });
		if (!users || users.length === 0) throw new NotFoundException(this.t.Errors.Id.NotFounds(User, ids));

		return await this.orm.em.find(UserVisibility, { user: { $in: users } });
	}

	@CreateRequestContext()
	async updateVisibility(id: number, input: UserVisibilityPatchDTO): Promise<UserVisibility> {
		const user = await this.orm.em.findOne(User, { id });
		if (!user) throw new NotFoundException(this.t.Errors.Id.NotFound(User, id));

		const visibility = await this.orm.em.findOne(UserVisibility, { user });
		// Should never happen as the visibility is created when the user is created
		/* istanbul ignore next-line */
		if (!visibility) throw new NotFoundException(this.t.Errors.Id.NotFound(UserVisibility, id));

		Object.assign(visibility, input);
		await this.orm.em.persistAndFlush(visibility);

		return visibility;
	}

	@CreateRequestContext()
	async register(input: UserPostDTO): Promise<User> {
		Object.entries(input).forEach(([key, value]) => {
			if (typeof value === 'string') {
				// @ts-ignore
				input[key] = value.trim();
			}
		});

		if (await this.orm.em.findOne(User, { email: input.email }))
			throw new BadRequestException(this.t.Errors.Email.IsAlreadyUsed(input.email));

		if (!checkBirthDate(input.birth_date))
			throw new BadRequestException(this.t.Errors.BirthDate.Invalid(input.birth_date));

		if (!checkPasswordStrength(input.password)) throw new BadRequestException(this.t.Errors.Password.Weak());

		// Check if the password is already hashed
		if (input.password.length !== 60) input.password = hashSync(input.password, 10);

		const user = this.orm.em.create(User, input);
		await this.orm.em.persistAndFlush(user);

		// Fetch the user again to get the id
		const registered = await this.findOne(input.email, false);
		await this.updateUserEmail(registered.id, input.email);

		// Save changes to the database & create the user's visibility parameters
		this.orm.em.create(UserVisibility, { user });

		return user;
	}

	@CreateRequestContext()
	async updateUserEmail(id: number, email: email): Promise<void> {
		this.emailsService.validateEmail(email);

		// Add the email verification token & create the user
		const user = await this.findOne(id, false);
		const user_b = await this.orm.em.findOne(User, { email });

		// Check if the email is already used by someone else
		if (user_b && user_b.id !== user.id) throw new BadRequestException(this.t.Errors.Email.IsAlreadyUsed(email));
		const email_token = generateRandomPassword(12);

		user.email_verification = hashSync(email_token, 10);
		user.email_verified = false;
		user.email = email;

		// First time setting the email -> account creation template
		if (user.verified === null)
			await this.emailsService.sendEmail({
				to: [email],
				subject: this.i18n.t('templates.register_common.subject', { lang: I18nContext.current().lang }),
				html: getTemplate('emails/register_user', this.i18n, {
					username: user.full_name,
					link: `${this.configService.get<string>('api_url')}/auth/confirm/${user.id}/${encodeURI(email_token)}`,
					days: this.configService.get<number>('users.verification_token_validity'),
				}),
			});
		// Email change -> email changed template
		else {
			await this.emailsService.sendEmail({
				to: [email],
				subject: this.i18n.t('templates.email_changed.subject', { lang: I18nContext.current().lang }),
				html: getTemplate('emails/email_changed', this.i18n, {
					username: user.full_name,
					link: `${this.configService.get<string>('api_url')}/auth/confirm/${user.id}/${encodeURI(email_token)}`,
				}),
			});
		}
	}

	@CreateRequestContext()
	async registerByAdmin(inputs: UserPostByAdminDTO[]): Promise<User[]> {
		const existing_users = await this.orm.em.find(User, { email: { $in: inputs.map((i) => i.email) } });
		if (existing_users.length > 0)
			throw new BadRequestException(
				existing_users.length === 1
					? this.t.Errors.Email.IsAlreadyUsed(existing_users[0].email)
					: this.t.Errors.Email.AreAlreadyUsed(existing_users.map((u) => u.email)),
			);

		const users: User[] = [];
		for (const input of inputs) {
			this.emailsService.validateEmail(input.email);
			if (!checkBirthDate(input.birth_date))
				throw new BadRequestException(this.t.Errors.BirthDate.Invalid(input.birth_date));

			// Generate a random password & hash it
			const password = generateRandomPassword(12);
			const user = this.orm.em.create(User, {
				...input,
				password: hashSync(password, 10),
				email_verified: true,
				verified: new Date(),
			});

			this.orm.em.create(UserVisibility, { user });
			users.push(user);

			await this.emailsService.sendEmail({
				to: [user.email],
				subject: this.i18n.t('templates.register_common.subject', { lang: I18nContext.current().lang }),
				html: getTemplate('emails/register_user_by_admin', this.i18n, {
					username: user.full_name,
					password,
				}),
			});

			await this.orm.em.persistAndFlush(user);
		}

		return users;
	}

	@CreateRequestContext()
	async verifyEmail(user_id: number, token: string): Promise<User> {
		const user = await this.findOne(user_id, false);
		if (user.email_verified) throw new BadRequestException(this.t.Errors.Email.AlreadyVerified(User));

		if (!compareSync(token, user.email_verification))
			throw new UnauthorizedException(this.t.Errors.Email.InvalidVerificationToken());

		if (user.verified === null) user.verified = new Date();
		user.email_verified = true;
		user.email_verification = null;

		await this.orm.em.persistAndFlush(user);
		return user;
	}

	@CreateRequestContext()
	async update(requestUserId: number, inputs: UserPatchDTO[]) {
		const users: User[] = [];

		for (const input of inputs) {
			const user = await this.findOne(input.id, false);

			if (input.email) await this.updateUserEmail(user.id, input.email);

			if (
				input.hasOwnProperty('birth_date') ||
				input.hasOwnProperty('first_name') ||
				input.hasOwnProperty('last_name')
			) {
				const currentUser = await this.findOne(requestUserId, false);

				if (currentUser.id === user.id)
					throw new UnauthorizedException(this.t.Errors.User.CannotUpdateBirthDateOrName());
			}

			Object.assign(user, input);

			await this.orm.em.persistAndFlush(user);
			users.push(user);
		}

		return users;
	}

	@CreateRequestContext()
	async delete(id: number) {
		const user = await this.orm.em.findOne(User, { id });
		await this.orm.em.removeAndFlush(user);

		return { message: this.t.Success.Entity.Deleted(User), statusCode: 200 };
	}

	@CreateRequestContext()
	async getUserRoles(id: number, input: { show_expired: boolean; show_revoked: boolean }): Promise<UserRolesGetDTO[]> {
		const user = await this.orm.em.findOne(User, { id }, { populate: ['roles'] });
		if (!user) throw new NotFoundException(this.t.Errors.Id.NotFound(User, id));

		const roles_base = user.roles.getItems();
		const roles_data = await this.orm.em.find(RoleExpiration, { user: { $in: [user] } });

		const roles = roles_data.map((d) => {
			const r = roles_base.find((r) => r.id === d.role.id);

			return {
				...r,
				users: undefined,
				expires: d.expires,
				revoked: d.revoked || r.revoked,
			};
		});

		if (!input.show_expired) roles.filter((p) => p.expires > new Date());
		if (!input.show_revoked) roles.filter((p) => p.revoked === false);

		return roles;
	}

	@CreateRequestContext()
	async getUserPermissions(id: number, input: { show_expired: boolean; show_revoked: boolean }): Promise<Permission[]> {
		const user = await this.orm.em.findOne(User, { id }, { populate: ['permissions'] });
		if (!user) throw new NotFoundException(this.t.Errors.Id.NotFound(User, id));

		const permissions = user.permissions.getItems();

		if (!input.show_expired) permissions.filter((p) => p.expires > new Date());
		if (!input.show_revoked) permissions.filter((p) => p.revoked === false);

		return permissions;
	}
}

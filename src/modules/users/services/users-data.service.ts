import type { email } from '#types';
import type { I18nTranslations, PERMISSION_NAMES } from '#types/api';

import { MikroORM, CreateRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { compareSync, hashSync } from 'bcrypt';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { z } from 'zod';

import { env } from '@env';
import { generateRandomPassword, isStrongPassword } from '@modules/_mixin/decorators';
import { OutputCreatedDTO, OutputMessageDTO } from '@modules/_mixin/dto/output.dto';
import { i18nBadRequestException, i18nNotFoundException, i18nUnauthorizedException } from '@modules/_mixin/http-errors';
import { InputRegisterUserAdminDTO, InputRegisterUserDTO } from '@modules/auth/dto/input.dto';
import { EmailsService } from '@modules/emails/emails.service';
import { OutputPermissionDTO } from '@modules/permissions/dto/output.dto';
import { RoleExpiration } from '@modules/roles/entities/role-expiration.entity';
import { UserVisibility } from '@modules/users/entities/user-visibility.entity';
import { User } from '@modules/users/entities/user.entity';
import { checkBirthDate } from '@utils/dates';
import { getTemplate } from '@utils/template';

import { InputUpdateUserDTO, InputUpdateUserVisibilityDTO } from '../dto/input.dto';
import { OutputUserDTO, OutputBaseUserDTO, OutputUserRoleDTO, OutputUserVisibilityDTO } from '../dto/output.dto';

@Injectable()
export class UsersDataService {
	constructor(
		private readonly orm: MikroORM,
		private readonly i18n: I18nService<I18nTranslations>,
		private readonly emailsService: EmailsService,
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
			created: { $lt: new Date(Date.now() - env.USERS_VERIFICATION_DELAY) },
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
	async sanitize(users: User[]): Promise<OutputUserDTO[]> {
		const res: OutputUserDTO[] = [];

		const visibilities = await this.findVisibilities(users.map((u) => u.id));
		visibilities.forEach((v) => {
			const user = users.find((u) => u.id === v.user_id).toObject() as unknown as OutputUserDTO;

			Object.entries(v).forEach(([key, val]) => {
				const key_ = key as keyof Omit<OutputUserVisibilityDTO, 'user_id'>;
				if (val === false) delete user[key_];
			});

			res.push(user);
		});

		return res;
	}

	/**
	 * Keep only the base fields of a user
	 * @param {User[]} users the users to filter
	 * @returns {OutputBaseUserDTO[]} The "filtered" users
	 */
	asBaseUsers(users: User[]): OutputBaseUserDTO[] {
		const res: OutputBaseUserDTO[] = [];
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
	 * @param {number | email} id_or_email The id or email of the user to find
	 * @param {boolean} filter Whether to filter the user or not (default: true)
	 *
	 * @returns {Promise<OutputUserDTO>} The user found (public if filter is true)
	 * @throws {BadRequestException} If no id or email is provided
	 * @throws {NotFoundException} If no user is found with the provided id/email
	 *
	 * @example
	 * ```ts
	 * const user1: UserGetPrivateDTO = await this.usersService.findOne({ id: 1 }, false);
	 * const user2: UserGetDTO = await this.usersService.findOne({ email: 'example@domain.com' });
	 * ```
	 */
	@CreateRequestContext()
	async findOne(id_or_email: number | email, filter: boolean): Promise<OutputUserDTO> {
		let user: User = null;
		const parsed = z.union([z.coerce.number(), z.string().email()]).parse(id_or_email);

		if (typeof parsed === 'number') user = await this.orm.em.findOne(User, { id: parsed });
		else if (typeof parsed === 'string') user = await this.orm.em.findOne(User, { email: parsed as email });

		if (!user && typeof parsed === 'number')
			throw new i18nNotFoundException('validations.user.not_found.id', { id: parsed });

		if (!user && typeof parsed === 'string')
			throw new i18nNotFoundException('validations.user.not_found.email', { email: parsed });

		if (filter) return (await this.sanitize([user]))[0];
		return user.toObject() as unknown as OutputUserDTO;
	}

	/**
	 * Return the visibility parameters of given users
	 * @param {number} ids The ids of the users
	 * @returns {Promise<OutputUserVisibilityDTO[]>} The visibility parameters of each user
	 */
	@CreateRequestContext()
	async findVisibilities(ids: number[] | number): Promise<OutputUserVisibilityDTO[]> {
		if (!Array.isArray(ids)) ids = [ids];

		const users = await this.orm.em.find(User, { id: { $in: ids } });
		if (!users || users.length === 0)
			if (ids.length === 1) throw new i18nNotFoundException('validations.user.not_found.id', { id: ids[0] });
			else throw new i18nNotFoundException('validations.users.not_found.ids', { ids: ids.join("', '") });

		const visibilities = await this.orm.em.find(UserVisibility, { user: { $in: users } });
		return visibilities.map((v) => v.toObject() as unknown as OutputUserVisibilityDTO);
	}

	@CreateRequestContext()
	async updateVisibility(id: number, input: InputUpdateUserVisibilityDTO): Promise<OutputUserVisibilityDTO> {
		const user = await this.orm.em.findOne(User, { id });
		if (!user) throw new i18nNotFoundException('validations.user.not_found.id', { id });

		const visibility = await this.orm.em.findOne(UserVisibility, { user });

		Object.assign(visibility, input);
		await this.orm.em.persistAndFlush(visibility);

		return visibility.toObject() as unknown as OutputUserVisibilityDTO;
	}

	@CreateRequestContext()
	async register(input: InputRegisterUserDTO): Promise<OutputCreatedDTO> {
		Object.entries(input).forEach(([key, value]) => {
			if (typeof value === 'string') {
				// @ts-ignore
				input[key] = value.trim();
			}
		});

		if (await this.orm.em.findOne(User, { email: input.email }))
			throw new i18nBadRequestException('validations.email.invalid.used', { email: input.email });

		if (!checkBirthDate(input.birth_date))
			throw new i18nBadRequestException('validations.birth_date.invalid.outbound', { date: input.birth_date });

		if (!isStrongPassword(input.password)) throw new i18nBadRequestException('validations.password.invalid.weak');

		// Check if the password is already hashed
		if (input.password.length !== 60) input.password = hashSync(input.password, 10);

		const user = this.orm.em.create(User, input);
		await this.orm.em.persistAndFlush(user);

		// Fetch the user again to get the id
		const registered = await this.findOne(input.email, false);
		await this.updateUserEmail(registered.id, input.email);

		// Save changes to the database & create the user's visibility parameters
		this.orm.em.create(UserVisibility, { user });

		return new OutputCreatedDTO('validations.user.success.registered', { name: registered.full_name });
	}

	@CreateRequestContext()
	async updateUserEmail(id: number, email: email): Promise<void> {
		this.emailsService.validateEmail(email);

		// Add the email verification token & create the user
		const user = await this.orm.em.findOne(User, { id });
		const user_b = await this.orm.em.findOne(User, { email });

		// Check if the email is already used by someone else
		if (user_b && user_b.id !== user.id) throw new i18nBadRequestException('validations.email.invalid.used', { email });
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
					link: `${env.API_URL}/auth/confirm/${user.id}/${encodeURI(email_token)}`,
					days: env.USERS_VERIFICATION_DELAY / (1000 * 60 * 60 * 24),
				}),
			});
		// Email change -> email changed template
		else {
			await this.emailsService.sendEmail({
				to: [email],
				subject: this.i18n.t('templates.email_changed.subject', { lang: I18nContext.current().lang }),
				html: getTemplate('emails/email_changed', this.i18n, {
					username: user.full_name,
					link: `${env.API_URL}/auth/confirm/${user.id}/${encodeURI(email_token)}`,
				}),
			});
		}
	}

	@CreateRequestContext()
	async registerByAdmin(inputs: InputRegisterUserAdminDTO[]): Promise<OutputBaseUserDTO[]> {
		const existing_users = await this.orm.em.find(User, { email: { $in: inputs.map((i) => i.email) } });

		if (existing_users.length > 0)
			if (existing_users.length === 1)
				throw new i18nBadRequestException('validations.email.invalid.used', { email: existing_users[0].email });
			else
				throw new i18nBadRequestException('validations.email.invalid.are_used', {
					emails: existing_users.map((u) => u.email).join("', '"),
				});

		const users: User[] = [];
		for (const input of inputs) {
			this.emailsService.validateEmail(input.email);

			if (!checkBirthDate(input.birth_date))
				throw new i18nBadRequestException('validations.birth_date.invalid.outbound', { date: input.birth_date });

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

		return this.asBaseUsers(users);
	}

	@CreateRequestContext()
	async verifyEmail(id: number, token: string): Promise<OutputMessageDTO> {
		const user = await this.orm.em.findOne(User, { id });
		if (user.email_verified) throw new i18nBadRequestException('validations.email.invalid.already_verified');

		if (!compareSync(token, user.email_verification))
			throw new i18nUnauthorizedException('validations.token.invalid.format');

		if (user.verified === null) user.verified = new Date();
		user.email_verified = true;
		user.email_verification = null;

		await this.orm.em.persistAndFlush(user);
		return new OutputMessageDTO('validations.email.success.verified');
	}

	@CreateRequestContext()
	async update(requestUserId: number, userId: number, input: InputUpdateUserDTO): Promise<OutputUserDTO> {
		const user = await this.orm.em.findOne(User, { id: userId });
		if (!user) throw new i18nNotFoundException('validations.user.not_found.id', { id: userId });

		if (input.email) await this.updateUserEmail(user.id, input.email);

		if (input.hasOwnProperty('birth_date') || input.hasOwnProperty('first_name') || input.hasOwnProperty('last_name')) {
			const currentUser = await this.findOne(requestUserId, false);

			if (currentUser.id === user.id) throw new i18nUnauthorizedException('validations.user.cannot_update');
		}

		Object.assign(user, input);

		await this.orm.em.persistAndFlush(user);
		return (await this.sanitize([user]))[0];
	}

	@CreateRequestContext()
	async delete(id: number): Promise<OutputMessageDTO> {
		const user = await this.orm.em.findOne(User, { id });
		await this.orm.em.removeAndFlush(user);

		return new OutputMessageDTO('validations.user.success.deleted', { name: user.full_name });
	}

	@CreateRequestContext()
	async getUserRoles(
		id: number,
		input: { show_expired: boolean; show_revoked: boolean },
	): Promise<OutputUserRoleDTO[]> {
		const user = await this.orm.em.findOne(User, { id }, { populate: ['roles'] });
		if (!user) throw new i18nNotFoundException('validations.user.not_found.id', { id });

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
	async getUserPermissions(
		id: number,
		input: { show_expired: boolean; show_revoked: boolean },
	): Promise<OutputPermissionDTO[]> {
		const user = await this.orm.em.findOne(User, { id }, { populate: ['permissions'] });
		if (!user) throw new i18nNotFoundException('validations.user.not_found.id', { id });

		const permissions = user.permissions.getItems();

		if (!input.show_expired) permissions.filter((p) => p.expires > new Date());
		if (!input.show_revoked) permissions.filter((p) => p.revoked === false);

		return permissions.map((p) => p.toObject() as unknown as OutputPermissionDTO);
	}

	/**
	 * Determines whether the user has permission or role with permission
	 * @param {number} id The id of the user
	 * @param {boolean} all True if all permissions must be present, false if only one
	 * @param {PERMISSION_NAMES[]} permissions Permissions to check
	 */
	@CreateRequestContext()
	async hasPermissionOrRoleWithPermission(id: number, all: boolean, permissions: PERMISSION_NAMES[]): Promise<boolean> {
		const user_perms = await this.getUserPermissions(id, { show_expired: false, show_revoked: false });
		const perms = user_perms.map((p) => p.name);

		const user_roles = await this.getUserRoles(id, { show_expired: false, show_revoked: false });
		const roles = user_roles
			.filter((r) => r.expires > new Date() && r.revoked === false)
			.map((r) => r.permissions)
			.flat();

		const acquired_perms = [...perms, ...roles];

		if (acquired_perms.includes('ROOT')) return true;
		if (all) return permissions.every((p) => acquired_perms.includes(p));
		return acquired_perms.some((p) => permissions.includes(p));
	}
}

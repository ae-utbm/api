import type { I18nTranslations, PERMISSION_NAMES } from '@types';

import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { I18nService } from 'nestjs-i18n';

import { Errors } from '@i18n';
import { BaseUserResponseDTO } from '@modules/users/dto/base-user.dto';
import { User } from '@modules/users/entities/user.entity';
import { validateObject } from '@utils/validate';
import { PERMISSIONS_NAMES } from 'src/types/api/permissions/perms';

import { RolePatchDTO } from './dto/patch.dto';
import { RolePostDTO } from './dto/post.dto';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
	constructor(private readonly orm: MikroORM, private readonly i18n: I18nService<I18nTranslations>) {}

	/**
	 * Automatically revoke roles that have expired
	 * Runs every 10 minutes
	 */
	@Cron('0 */10 * * * *')
	@UseRequestContext()
	async revokeExpiredRoles(): Promise<void> {
		const roles = await this.orm.em.find(Role, { expires: { $lte: new Date() }, revoked: false });
		if (!roles.length) return;

		roles.forEach((role) => {
			role.revoked = true;
			role.updated_at = new Date();
		});

		await this.orm.em.persistAndFlush(roles);
	}

	/**
	 * Get all roles from the database and filter them according to the input
	 * @returns the array of all roles
	 */
	@UseRequestContext()
	async getAllRoles(): Promise<Omit<Role, 'users'>[]> {
		const roles = await this.orm.em.find(Role, {});

		roles.forEach((r) => delete r.users);
		return roles;
	}

	@UseRequestContext()
	async createRole(
		name: Uppercase<string>,
		permissions: PERMISSION_NAMES[],
		expires: Date,
	): Promise<Omit<Role, 'users'>> {
		name = name.toUpperCase();

		validateObject({
			object: { name, permissions, expires },
			requiredKeys: ['name', 'permissions', 'expires'],
			type: RolePostDTO,
			i18n: this.i18n,
		});

		if (await this.orm.em.findOne(Role, { name }))
			throw new BadRequestException(Errors.Role.NameAlreadyUsed({ name, i18n: this.i18n }));

		// Remove eventual duplicates
		permissions = permissions.unique();

		permissions.forEach((p) => {
			if (!PERMISSIONS_NAMES.includes(p))
				throw new BadRequestException(Errors.Permission.Invalid({ permission: p, i18n: this.i18n }));
		});

		const role = this.orm.em.create(Role, { name, permissions, expires });
		await this.orm.em.persistAndFlush(role);

		delete role.users;
		return role;
	}

	@UseRequestContext()
	async editRole(input: RolePatchDTO): Promise<Omit<Role, 'users'> & { users: number }> {
		const role = await this.orm.em.findOne(Role, { id: input.id });
		if (!role) throw new NotFoundException(Errors.Generic.IdNotFound({ type: Role, id: input.id, i18n: this.i18n }));

		role.name = input.name.toUpperCase();
		role.permissions = input.permissions;
		role.expires = input.expires;
		await this.orm.em.persistAndFlush(role);

		await role.users.init();
		return { ...role, users: role.users.count() };
	}

	@UseRequestContext()
	async getUsers(id: number): Promise<BaseUserResponseDTO[]> {
		const role = await this.orm.em.findOne(Role, { id });
		if (!role) throw new NotFoundException(Errors.Generic.IdNotFound({ type: Role, id, i18n: this.i18n }));

		await role.users.init();

		const res: BaseUserResponseDTO[] = [];
		for (const user of role.users) {
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

	@UseRequestContext()
	async addUser(role_id: number, user_id: number): Promise<BaseUserResponseDTO[]> {
		const role = await this.orm.em.findOne(Role, { id: role_id });
		if (!role) throw new NotFoundException(Errors.Generic.IdNotFound({ type: Role, id: role_id, i18n: this.i18n }));

		const user = await this.orm.em.findOne(User, { id: user_id });
		if (!user) throw new NotFoundException(Errors.Generic.IdNotFound({ type: User, id: user_id, i18n: this.i18n }));

		await role.users.init();
		role.users.add(user);
		await this.orm.em.persistAndFlush([role, user]);

		const res: BaseUserResponseDTO[] = [];
		role.users.getItems().forEach((user) =>
			res.push({
				id: user.id,
				updated_at: user.updated_at,
				created_at: user.created_at,
				first_name: user.first_name,
				last_name: user.last_name,
				nickname: user.nickname,
			}),
		);

		return res;
	}

	@UseRequestContext()
	async removeUser(role_id: number, user_id: number): Promise<BaseUserResponseDTO[]> {
		const role = await this.orm.em.findOne(Role, { id: role_id });
		if (!role) throw new NotFoundException(Errors.Generic.IdNotFound({ type: Role, id: role_id, i18n: this.i18n }));

		const user = await this.orm.em.findOne(User, { id: user_id });
		if (!user) throw new NotFoundException(Errors.Generic.IdNotFound({ type: User, id: user_id, i18n: this.i18n }));

		await role.users.init();
		role.users.remove(user);
		await this.orm.em.persistAndFlush([role, user]);

		const res: BaseUserResponseDTO[] = [];
		role.users.getItems().forEach((user) =>
			res.push({
				id: user.id,
				updated_at: user.updated_at,
				created_at: user.created_at,
				first_name: user.first_name,
				last_name: user.last_name,
				nickname: user.nickname,
			}),
		);

		return res;
	}
}

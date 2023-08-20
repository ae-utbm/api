import type { I18nTranslations, PERMISSION_NAMES } from '@types';

import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { I18nService } from 'nestjs-i18n';

import { Errors } from '@i18n';
import { BaseUserResponseDTO } from '@modules/users/dto/base-user.dto';
import { User } from '@modules/users/entities/user.entity';
import { UsersService } from '@modules/users/users.service';
import { PERMISSIONS_NAMES } from 'src/types/api/permissions/perms';

import { RolePatchDTO } from './dto/patch.dto';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
	constructor(
		private readonly orm: MikroORM,
		private readonly i18n: I18nService<I18nTranslations>,
		private readonly usersService: UsersService,
	) {}

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
	async getAllRoles(): Promise<(Omit<Role, 'users'> & { users: number })[]> {
		const roles = await this.orm.em.find(Role, {}, { populate: ['users'] });
		return roles.map((r) => ({ ...r, users: r.users.count() }));
	}

	@UseRequestContext()
	async getRole(id: number): Promise<Omit<Role, 'users'> & { users: number }> {
		const role = await this.orm.em.findOne(Role, { id }, { populate: ['users'] });
		if (!role) throw new NotFoundException(Errors.Generic.IdNotFound({ type: Role, id, i18n: this.i18n }));

		return { ...role, users: role.users.count() };
	}

	@UseRequestContext()
	async createRole(name: string, permissions: PERMISSION_NAMES[], expires: Date): Promise<Omit<Role, 'users'>> {
		const roleName = name.toUpperCase();

		if (await this.orm.em.findOne(Role, { name: roleName }))
			throw new BadRequestException(Errors.Role.NameAlreadyUsed({ name: roleName, i18n: this.i18n }));

		// Remove eventual duplicates
		permissions = permissions.unique();

		permissions.forEach((p) => {
			if (!PERMISSIONS_NAMES.includes(p))
				throw new BadRequestException(Errors.Permission.Invalid({ permission: p, i18n: this.i18n }));
		});

		const role = this.orm.em.create(Role, { name: roleName, permissions, expires });
		await this.orm.em.persistAndFlush(role);

		delete role.users;
		return role;
	}

	@UseRequestContext()
	async editRole(input: RolePatchDTO): Promise<Omit<Role, 'users'> & { users: number }> {
		const role = await this.orm.em.findOne(Role, { id: input.id }, { populate: ['users'] });
		if (!role) throw new NotFoundException(Errors.Generic.IdNotFound({ type: Role, id: input.id, i18n: this.i18n }));

		role.name = input.name.toUpperCase();
		role.permissions = input.permissions.unique();
		role.expires = input.expires;
		await this.orm.em.persistAndFlush(role);

		return { ...role, users: role.users.count() };
	}

	@UseRequestContext()
	async getUsers(id: number): Promise<BaseUserResponseDTO[]> {
		const role = await this.orm.em.findOne(Role, { id }, { populate: ['users'] });
		if (!role) throw new NotFoundException(Errors.Generic.IdNotFound({ type: Role, id, i18n: this.i18n }));

		return this.usersService.asBaseUsers(role.users.getItems().sort((a, b) => a.id - b.id));
	}

	@UseRequestContext()
	async addUsers(role_id: number, users_id: number[]): Promise<BaseUserResponseDTO[]> {
		const role = await this.orm.em.findOne(Role, { id: role_id }, { populate: ['users'] });
		if (!role) throw new NotFoundException(Errors.Generic.IdNotFound({ type: Role, id: role_id, i18n: this.i18n }));

		const users = await this.orm.em.find(User, { id: { $in: users_id } });
		if (!users.length)
			throw new NotFoundException(Errors.Generic.IdNotFound({ type: User, id: users_id.toString(), i18n: this.i18n }));

		role.users.add(users);

		await this.orm.em.persistAndFlush([role, ...users]);
		return this.usersService.asBaseUsers(role.users.getItems().sort((a, b) => a.id - b.id));
	}

	@UseRequestContext()
	async removeUsers(role_id: number, users_id: number[]): Promise<BaseUserResponseDTO[]> {
		const role = await this.orm.em.findOne(Role, { id: role_id }, { populate: ['users'] });
		if (!role) throw new NotFoundException(Errors.Generic.IdNotFound({ type: Role, id: role_id, i18n: this.i18n }));

		const users = await this.orm.em.find(User, { id: { $in: users_id } });
		if (!users.length)
			throw new NotFoundException(Errors.Generic.IdNotFound({ type: User, id: users_id.toString(), i18n: this.i18n }));

		role.users.remove(users);

		await this.orm.em.persistAndFlush([role, ...users]);
		return this.usersService.asBaseUsers(role.users.getItems().sort((a, b) => a.id - b.id));
	}
}

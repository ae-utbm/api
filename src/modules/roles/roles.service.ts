import type { PERMISSION_NAMES } from '#types/api';

import { MikroORM, CreateRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { i18nBadRequestException, i18nNotFoundException } from '@modules/base/http-errors';
import { OutputBaseUserDTO } from '@modules/users/dto/output.dto';
import { User } from '@modules/users/entities/user.entity';
import { UsersDataService } from '@modules/users/services/users-data.service';

import { InputUpdateRoleDTO } from './dto/input.dto';
import { OutputRoleDTO, OutputRoleUserDTO } from './dto/output.dto';
import { RoleExpiration } from './entities/role-expiration.entity';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
	constructor(private readonly orm: MikroORM, private readonly usersService: UsersDataService) {}

	/**
	 * Automatically revoke roles that have expired
	 * Runs every 10 minutes
	 */
	@Cron('0 */10 * * * *')
	@CreateRequestContext()
	async revokeExpiredRoles(): Promise<void> {
		const roles = await this.orm.em.find(RoleExpiration, { expires: { $lte: new Date() } });

		roles.map((r) => {
			r.revoked = true;
			r.updated = new Date();

			return r;
		});

		await this.orm.em.persistAndFlush(roles);
	}

	/**
	 * Get all roles from the database and filter them according to the input
	 * @returns the array of all roles
	 */
	@CreateRequestContext()
	async getAllRoles(): Promise<OutputRoleDTO[]> {
		const roles = await this.orm.em.find(Role, {}, { populate: ['users'] });
		return roles.map((r) => r.toObject() as unknown as OutputRoleDTO);
	}

	@CreateRequestContext()
	async getRole(id: number): Promise<OutputRoleDTO> {
		const role = await this.orm.em.findOne(Role, { id }, { populate: ['users'] });
		if (!role) throw new i18nNotFoundException('validations.role.not_found', { id });

		return role.toObject() as unknown as OutputRoleDTO;
	}

	@CreateRequestContext()
	async createRole(name: string, permissions: PERMISSION_NAMES[]): Promise<OutputRoleDTO> {
		const roleName = name.toUpperCase();

		if (await this.orm.em.findOne(Role, { name: roleName }))
			throw new i18nBadRequestException('validations.role.invalid.already_exist', { name: roleName });

		const role = this.orm.em.create(Role, { name: roleName, permissions: permissions.unique() });
		await this.orm.em.persistAndFlush(role);

		return role.toObject() as unknown as OutputRoleDTO;
	}

	@CreateRequestContext()
	async editRole(input: InputUpdateRoleDTO): Promise<OutputRoleDTO> {
		const role = await this.orm.em.findOne(Role, { id: input.id }, { populate: ['users'] });
		if (!role) throw new i18nNotFoundException('validations.role.not_found', { id: input.id });

		role.name = input.name.toUpperCase();
		role.permissions = input.permissions.unique();
		await this.orm.em.persistAndFlush(role);

		return role.toObject() as unknown as OutputRoleDTO;
	}

	@CreateRequestContext()
	async getUsers(id: number): Promise<Array<OutputRoleUserDTO>> {
		const role = await this.orm.em.findOne(Role, { id }, { populate: ['users'] });
		if (!role) throw new i18nNotFoundException('validations.role.not_found', { id });

		const role_expirations = await this.orm.em.find(RoleExpiration, { role: { id }, revoked: false });
		const users_ids = role_expirations.map((r) => r.user.id).unique();

		const users = this.usersService.asBaseUsers(role.users.getItems().filter((u) => users_ids.includes(u.id)));
		return users.map((u) => ({ ...u, role_expires: role_expirations.find((r) => r.user.id === u.id).expires }));
	}

	@CreateRequestContext()
	async addUsers(role_id: number, users_specs: Array<{ id: number; expires: Date }>) {
		const role = await this.orm.em.findOne(Role, { id: role_id }, { populate: ['users'] });
		if (!role) throw new i18nNotFoundException('validations.role.not_found', { id: role_id });

		const users_ids = users_specs.map((u) => u.id);
		const users = await this.orm.em.find(User, { id: { $in: users_ids } });

		// If one user is not found, throw an error
		if (users.length !== users_ids.length)
			throw new i18nNotFoundException('validations.users.not_found.ids', { ids: users_ids.join("', '") });

		role.users.add(users);

		const roles_expirations: RoleExpiration[] = [];
		for (const u of users_specs) {
			roles_expirations.push(
				this.orm.em.create(RoleExpiration, { user: users.find((user) => user.id === u.id), role, expires: u.expires }),
			);
		}

		await this.orm.em.persistAndFlush([role, ...users, ...roles_expirations]);
		return this.getUsers(role_id);
	}

	@CreateRequestContext()
	async removeUsers(role_id: number, users_id: number[]): Promise<OutputBaseUserDTO[]> {
		const role = await this.orm.em.findOne(Role, { id: role_id }, { populate: ['users'] });
		if (!role) throw new i18nNotFoundException('validations.role.not_found', { id: role_id });

		const users = await this.orm.em.find(User, { id: { $in: users_id } });
		if (!users.length)
			throw new i18nNotFoundException('validations.users.not_found.ids', { ids: users_id.join("', '") });

		const roleExpirations = await this.orm.em.find(RoleExpiration, {
			role,
			user: { $in: users },
		});

		roleExpirations.forEach((r) => (r.revoked = true));
		await this.orm.em.persistAndFlush([role, ...users, ...roleExpirations]);

		return this.getUsers(role_id);
	}
}

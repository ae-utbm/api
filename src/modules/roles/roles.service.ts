import type { PERMISSION_NAMES } from '#types/api';

import { MikroORM, CreateRequestContext } from '@mikro-orm/core';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PERMISSIONS_NAMES } from '@exported/api/constants/perms';
import { TranslateService } from '@modules/translate/translate.service';
import { BaseUserResponseDTO } from '@modules/users/dto/base-user.dto';
import { User } from '@modules/users/entities/user.entity';
import { UsersDataService } from '@modules/users/services/users-data.service';

import { RoleGetDTO, RoleUsersResponseDTO } from './dto/get.dto';
import { RolePatchDTO } from './dto/patch.dto';
import { RoleExpiration } from './entities/role-expiration.entity';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
	constructor(
		private readonly orm: MikroORM,
		private readonly t: TranslateService,
		private readonly usersService: UsersDataService,
	) {}

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
	async getAllRoles(): Promise<RoleGetDTO[]> {
		const roles = await this.orm.em.find(Role, {}, { populate: ['users'] });
		return roles.map((r) => r.toObject() as unknown as RoleGetDTO);
	}

	@CreateRequestContext()
	async getRole(id: number): Promise<RoleGetDTO> {
		const role = await this.orm.em.findOne(Role, { id }, { populate: ['users'] });
		if (!role) throw new NotFoundException(this.t.Errors.Id.NotFound(Role, id));

		return role.toObject() as unknown as RoleGetDTO;
	}

	@CreateRequestContext()
	async createRole(name: string, permissions: PERMISSION_NAMES[]): Promise<RoleGetDTO> {
		const roleName = name.toUpperCase();

		if (await this.orm.em.findOne(Role, { name: roleName }))
			throw new BadRequestException(this.t.Errors.Role.NameAlreadyUsed(roleName));

		// Remove eventual duplicates
		permissions = permissions.unique();

		permissions.forEach((p) => {
			if (!PERMISSIONS_NAMES.includes(p)) throw new BadRequestException(this.t.Errors.Permission.Invalid(p));
		});

		const role = this.orm.em.create(Role, { name: roleName, permissions });
		await this.orm.em.persistAndFlush(role);

		return role.toObject() as unknown as RoleGetDTO;
	}

	@CreateRequestContext()
	async editRole(input: RolePatchDTO): Promise<RoleGetDTO> {
		const role = await this.orm.em.findOne(Role, { id: input.id }, { populate: ['users'] });
		if (!role) throw new NotFoundException(this.t.Errors.Id.NotFound(Role, input.id));

		role.name = input.name.toUpperCase();
		role.permissions = input.permissions.unique();
		await this.orm.em.persistAndFlush(role);

		return role.toObject() as unknown as RoleGetDTO;
	}

	@CreateRequestContext()
	async getUsers(id: number): Promise<Array<RoleUsersResponseDTO>> {
		const role = await this.orm.em.findOne(Role, { id }, { populate: ['users'] });
		if (!role) throw new NotFoundException(this.t.Errors.Id.NotFound(Role, id));

		const role_expirations = await this.orm.em.find(RoleExpiration, { role: { id }, revoked: false });
		const users_ids = role_expirations.map((r) => r.user.id).unique();

		const users = this.usersService.asBaseUsers(role.users.getItems().filter((u) => users_ids.includes(u.id)));
		return users.map((u) => ({ ...u, role_expires: role_expirations.find((r) => r.user.id === u.id).expires }));
	}

	@CreateRequestContext()
	async addUsers(role_id: number, users_specs: Array<{ id: number; expires: Date }>) {
		const role = await this.orm.em.findOne(Role, { id: role_id }, { populate: ['users'] });
		if (!role) throw new NotFoundException(this.t.Errors.Id.NotFound(Role, role_id));

		const users_ids = users_specs.map((u) => u.id);
		const users = await this.orm.em.find(User, { id: { $in: users_ids } });

		// If one user is not found, throw an error
		if (users.length !== users_ids.length)
			throw new NotFoundException(this.t.Errors.Id.NotFound(User, users_ids.join(', ')));

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
	async removeUsers(role_id: number, users_id: number[]): Promise<BaseUserResponseDTO[]> {
		const role = await this.orm.em.findOne(Role, { id: role_id }, { populate: ['users'] });
		if (!role) throw new NotFoundException(this.t.Errors.Id.NotFound(Role, role_id));

		const users = await this.orm.em.find(User, { id: { $in: users_id } });
		if (!users.length) throw new NotFoundException(this.t.Errors.Id.NotFound(User, users_id.join(', ')));

		const roleExpirations = await this.orm.em.find(RoleExpiration, {
			role,
			user: { $in: users },
		});

		roleExpirations.forEach((r) => (r.revoked = true));
		await this.orm.em.persistAndFlush([role, ...users, ...roleExpirations]);

		return this.getUsers(role_id);
	}
}

import type { PERMISSION_NAMES } from '@types';

import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { TranslateService } from '@modules/translate/translate.service';
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
		private readonly t: TranslateService,
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

		roles.map((r) => {
			r.revoked = true;
			r.updated_at = new Date();

			return r;
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
		if (!role) throw new NotFoundException(this.t.Errors.Id.NotFound(Role, id));

		return { ...role, users: role.users.count() };
	}

	@UseRequestContext()
	async createRole(name: string, permissions: PERMISSION_NAMES[], expires: Date): Promise<Omit<Role, 'users'>> {
		const roleName = name.toUpperCase();

		if (await this.orm.em.findOne(Role, { name: roleName }))
			throw new BadRequestException(this.t.Errors.Role.NameAlreadyUsed(roleName));

		// Remove eventual duplicates
		permissions = permissions.unique();

		permissions.forEach((p) => {
			if (!PERMISSIONS_NAMES.includes(p)) throw new BadRequestException(this.t.Errors.Permission.Invalid(p));
		});

		const role = this.orm.em.create(Role, { name: roleName, permissions, expires });
		await this.orm.em.persistAndFlush(role);

		delete role.users;
		return role;
	}

	@UseRequestContext()
	async editRole(input: RolePatchDTO): Promise<Omit<Role, 'users'> & { users: number }> {
		const role = await this.orm.em.findOne(Role, { id: input.id }, { populate: ['users'] });
		if (!role) throw new NotFoundException(this.t.Errors.Id.NotFound(Role, input.id));

		role.name = input.name.toUpperCase();
		role.permissions = input.permissions.unique();
		role.expires = input.expires;
		await this.orm.em.persistAndFlush(role);

		return { ...role, users: role.users.count() };
	}

	@UseRequestContext()
	async getUsers(id: number): Promise<BaseUserResponseDTO[]> {
		const role = await this.orm.em.findOne(Role, { id }, { populate: ['users'] });
		if (!role) throw new NotFoundException(this.t.Errors.Id.NotFound(Role, id));

		return this.usersService.asBaseUsers(role.users.getItems());
	}

	@UseRequestContext()
	async addUsers(role_id: number, users_id: number[]): Promise<BaseUserResponseDTO[]> {
		const role = await this.orm.em.findOne(Role, { id: role_id }, { populate: ['users'] });
		if (!role) throw new NotFoundException(this.t.Errors.Id.NotFound(Role, role_id));

		const users = await this.orm.em.find(User, { id: { $in: users_id } });
		if (!users.length) throw new NotFoundException(this.t.Errors.Id.NotFound(User, users_id.join(', ')));

		role.users.add(users);

		await this.orm.em.persistAndFlush([role, ...users]);
		return this.usersService.asBaseUsers(role.users.getItems());
	}

	@UseRequestContext()
	async removeUsers(role_id: number, users_id: number[]): Promise<BaseUserResponseDTO[]> {
		const role = await this.orm.em.findOne(Role, { id: role_id }, { populate: ['users'] });
		if (!role) throw new NotFoundException(this.t.Errors.Id.NotFound(Role, role_id));

		const users = await this.orm.em.find(User, { id: { $in: users_id } });
		if (!users.length) throw new NotFoundException(this.t.Errors.Id.NotFound(User, users_id.join(', ')));

		role.users.remove(users);

		await this.orm.em.persistAndFlush([role, ...users]);
		return this.usersService.asBaseUsers(role.users.getItems());
	}
}

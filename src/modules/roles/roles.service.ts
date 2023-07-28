import type { PermissionName } from '@types';

import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { BaseUserResponseDTO } from '@modules/users/dto/base-user.dto';
import { User } from '@modules/users/entities/user.entity';
import { PERMISSIONS_NAMES } from 'src/types/api/permissions/perms';

import { RolePatchDTO } from './dto/patch.dto';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
	constructor(private readonly orm: MikroORM) {}

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
	 * @param input Input to filter the roles
	 * @returns {Promise<Role[]>} Array of roles
	 */
	@UseRequestContext()
	async getAllRoles(input: { show_expired: boolean; show_revoked: boolean }): Promise<Role[]> {
		const roles = await this.orm.em.find(Role, {});

		if (!input.show_expired) roles.filter((p) => p.expires > new Date());
		if (!input.show_revoked) roles.filter((p) => p.revoked === false);

		return roles;
	}

	@UseRequestContext()
	async createRole(name: Uppercase<string>, permissions: PermissionName[], expires: Date) {
		if (name.toUpperCase() !== name) name = name.toUpperCase();

		if (await this.orm.em.findOne(Role, { name }))
			throw new BadRequestException(`Role with name ${name} already exists`);

		permissions.forEach((p) => {
			if (!PERMISSIONS_NAMES.includes(p)) throw new BadRequestException(`Permission ${p} does not exist`);
		});

		const role = this.orm.em.create(Role, { name, permissions, expires });
		await this.orm.em.persistAndFlush(role);

		delete role.users;
		return { ...role };
	}

	@UseRequestContext()
	async editRole(input: RolePatchDTO): Promise<Omit<Role, 'users'> & { users: number }> {
		const role = await this.orm.em.findOne(Role, { id: input.id });
		if (!role) throw new NotFoundException(`Role with ID ${input.id} not found`);
		if (input.name.toUpperCase() !== input.name) throw new BadRequestException('Role name must be uppercase');

		role.name = input.name;
		role.permissions = input.permissions;
		role.expires = input.expires;
		await this.orm.em.persistAndFlush(role);

		await role.users.init();
		return { ...role, users: role.users.count() };
	}

	@UseRequestContext()
	async getUsers(id: number): Promise<BaseUserResponseDTO[]> {
		const role = await this.orm.em.findOne(Role, { id });
		if (!role) throw new NotFoundException(`Role with ID ${id} not found`);

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
		if (!role) throw new NotFoundException(`Role with ID ${role_id} not found`);

		const user = await this.orm.em.findOne(User, { id: user_id });
		if (!user) throw new NotFoundException(`User with ID ${user_id} not found`);

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
		if (!role) throw new NotFoundException(`Role with ID ${role_id} not found`);

		const user = await this.orm.em.findOne(User, { id: user_id });
		if (!user) throw new NotFoundException(`User with ID ${user_id} not found`);

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

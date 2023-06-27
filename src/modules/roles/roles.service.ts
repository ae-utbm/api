import type { PermissionName } from 'src/types';

import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from './entities/role.entity';
import { RolePatchDTO } from './dto/patch.dto';

@Injectable()
export class RolesService {
	constructor(private readonly orm: MikroORM) {}

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
		const role = this.orm.em.create(Role, { name, permissions, expires });
		await this.orm.em.persistAndFlush(role);
		return role;
	}

	@UseRequestContext()
	async editRole(input: RolePatchDTO) {
		const role = await this.orm.em.findOne(Role, { id: input.id });
		if (!role) throw new NotFoundException(`Role with ID ${input.id} not found`);

		role.name = input.name;
		role.permissions = input.permissions;
		role.expires = input.expires;
		this.orm.em.persistAndFlush(role);

		return role;
	}

	@UseRequestContext()
	async getRoleUsers(id: number) {
		const role = await this.orm.em.findOne(Role, { id });
		if (!role) throw new NotFoundException(`Role with ID ${id} not found`);

		return role.users;
	}
}

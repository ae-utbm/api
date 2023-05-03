import type { PermissionName } from '@types';

import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Role } from './entities/role.entity';
import { User } from '../users/entities/user.entity';
import { PermissionArgs, PermissionArgsNoId } from '@modules/perms/models/perms.args';

@Injectable()
export class RolesService {
	constructor(private readonly orm: MikroORM) {}

	/**
	 * Get all roles from the database and filter them according to the input
	 * @param {PermissionArgsNoId} input Input to filter the roles
	 * @returns {Promise<Role[]>} Array of roles
	 */
	@UseRequestContext()
	async getAllRoles(input: PermissionArgsNoId): Promise<Role[]> {
		const roles = await this.orm.em.find(Role, {});

		if (!input.show_expired) roles.filter((p) => p.expires > new Date());
		if (!input.show_revoked) roles.filter((p) => p.revoked === false);

		return roles;
	}

	@UseRequestContext()
	async createRole(name: Uppercase<string>, permissions: PermissionName[], expires: Date) {
		return this.orm.em.create(Role, { name, permissions, expires });
	}

	@UseRequestContext()
	async revokeRole(id: number) {
		const role = await this.orm.em.findOneOrFail(Role, { id });
		role.revoked = true;
		this.orm.em.persistAndFlush(role);

		return role;
	}

	@UseRequestContext()
	async editExpirationOfRole(id: number, date: Date) {
		const role = await this.orm.em.findOneOrFail(Role, { id });
		role.expires = date;
		this.orm.em.persistAndFlush(role);

		return role;
	}

	@UseRequestContext()
	async getUserRoles(input: PermissionArgs) {
		const user = await this.orm.em.findOneOrFail(User, { id: input.id });
		const roles = await user.roles.loadItems();

		if (!input.show_expired) roles.filter((p) => p.expires > new Date());
		if (!input.show_revoked) roles.filter((p) => p.revoked === false);

		return roles;
	}
}

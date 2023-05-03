import type { PermissionName } from '@types';

import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { Permission } from './entities/permission.entity';
import { Role } from '../roles/entities/role.entity';
import { PERMISSIONS } from './perms';
import { RawPermissionObject } from './models/raw-perms.object';
import { PermissionArgs } from './models/perms.args';

@Injectable()
export class PermissionsService {
	constructor(private readonly orm: MikroORM) {}

	/**
	 * Returns all permissions available in the API
	 * @param {boolean} addRoot Wether to add the ROOT permission or not to the returned array
	 * @returns {RawPermissionObject[]} The permissions available in the API
	 */
	getAllPermissions(addRoot = false): RawPermissionObject[] {
		return PERMISSIONS.filter((p) => addRoot || p.name !== 'ROOT');
	}

	/**
	 * Add a permission to a user
	 * @param {PermissionName} name The permission name in caps
	 * @param {number} user_id To which user the permission should be added
	 * @param {Date} expires When the permission should expire
	 * @returns {Promise<Permission>} The created permission
	 */
	@UseRequestContext()
	async addPermissionToUser(name: PermissionName, user_id: number, expires: Date): Promise<Permission> {
		const user = await this.orm.em.findOneOrFail(User, { id: user_id });
		const perm = PERMISSIONS.find((p) => p.name === name);

		const permission = this.orm.em.create(Permission, { ...perm, user, expires });
		await this.orm.em.persistAndFlush(permission);
		return permission;
	}

	/**
	 * Add a permission to an existing role
	 * @param {PermissionName} name The permission name in caps
	 * @param {number} role_id the role id to which the permission should be added
	 * @returns {Promise<Role>}
	 */
	@UseRequestContext()
	async addPermissionToRole(name: PermissionName, role_id: number): Promise<Role> {
		const role = await this.orm.em.findOneOrFail(Role, { id: role_id });
		role.permissions.push(name);
		await this.orm.em.persistAndFlush(role);

		return role;
	}

	/**
	 * Get all permissions of a user
	 * @param {PermissionArgs} input Arguments for the query
	 * @returns {Promise<Permission[]>} The permissions of the user
	 */
	@UseRequestContext()
	async getPermissionsOfUser(input: PermissionArgs): Promise<Permission[]> {
		const user = await this.orm.em.findOneOrFail(User, { id: input.id });
		const perms = await user.permissions.loadItems();

		if (!input.show_expired) perms.filter((p) => p.expires > new Date());
		if (!input.show_revoked) perms.filter((p) => p.revoked === false);

		return perms;
	}

	/**
	 * Get all permissions attached to a role
	 * @param {number} role_id The role id
	 * @returns {Promise<PermissionName[]>} The permissions of the role
	 */
	@UseRequestContext()
	async getPermissionsOfRole(role_id: number): Promise<RawPermissionObject[]> {
		const role = await this.orm.em.findOneOrFail(Role, { id: role_id });
		const perms = role.permissions;

		return PERMISSIONS.filter((p) => perms.includes(p.name));
	}
}

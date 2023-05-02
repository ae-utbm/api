import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { Permission } from './entities/permission.entity';
import { PERMISSIONS, PermissionName } from './decorators/perms.decorator';

@Injectable()
export class PermissionsService {
	constructor(private readonly orm: MikroORM) {}

	getAllPermissions() {
		return PERMISSIONS;
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
	 * Get all permissions of a user
	 * @param {number} user_id The user id
	 * @param {boolean} showExpired Determines if expired permissions should be included
	 * @param {boolean} showRevoked Determines if revoked permissions should be included
	 * @returns {Promise<Permission[]>} The permissions of the user
	 */
	@UseRequestContext()
	async getPermissionsOfUser(user_id: number, showExpired = false, showRevoked = false): Promise<Permission[]> {
		const user = await this.orm.em.findOneOrFail(User, { id: user_id });
		const perms = await user.permissions.loadItems();

		if (!showExpired) perms.filter((p) => p.expires > new Date());
		if (!showRevoked) perms.filter((p) => p.revoked === false);

		return perms;
	}
}

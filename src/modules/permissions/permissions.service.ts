import type { PermissionName } from '@types';

import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PERMISSIONS_NAMES } from 'src/types/api/permissions/perms';

import { PermissionPatchDTO } from './dto/patch.dto';
import { Permission } from './entities/permission.entity';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PermissionsService {
	constructor(private readonly orm: MikroORM) {}

	/**
	 * Automatically revoke permissions that have expired
	 * Runs every 10 minutes
	 */
	@Cron('0 */10 * * * *')
	@UseRequestContext()
	async revokeExpiredPermissions(): Promise<void> {
		const permissions = await this.orm.em.find(Permission, { expires: { $lte: new Date() }, revoked: false });
		if (!permissions.length) return;

		permissions.forEach((role) => {
			role.revoked = true;
			role.updated_at = new Date();
		});

		await this.orm.em.persistAndFlush(permissions);
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
		const user = await this.orm.em.findOne(User, { id: user_id });
		if (!user) throw new NotFoundException(`User with id '${user_id}' not found`);
		if (!PERMISSIONS_NAMES.includes(name)) throw new BadRequestException(`Permission '${name}' does not exist`);

		const permission = this.orm.em.create(Permission, { name, user, expires, revoked: false });

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
		const role = await this.orm.em.findOne(Role, { id: role_id });
		if (!role) throw new NotFoundException(`Role with id '${role_id}' not found`);
		if (!PERMISSIONS_NAMES.includes(name)) throw new BadRequestException(`Permission '${name}' does not exist`);

		if (!role.permissions.includes(name)) {
			role.permissions.push(name);
			await this.orm.em.persistAndFlush(role);
		}

		return role;
	}

	/**
	 * Get all permissions of a user
	 * @param input Arguments for the query
	 * @returns {Promise<Permission[]>} The permissions of the user
	 */
	@UseRequestContext()
	async getPermissionsOfUser(
		id: number,
		input?: { show_expired: boolean; show_revoked: boolean },
	): Promise<Permission[]> {
		const user = await this.orm.em.findOne(User, { id });
		if (!user) throw new NotFoundException('User not found');

		const perms = await user.permissions.loadItems();

		if (input && !input.show_expired) perms.filter((p) => p.expires > new Date());
		if (input && !input.show_revoked) perms.filter((p) => p.revoked === false);

		return perms;
	}

	/**
	 * Get all permissions attached to a role
	 * @param {number} role_id The role id
	 * @returns {Promise<PermissionName[]>} The permissions of the role
	 */
	@UseRequestContext()
	async getPermissionsOfRole(role_id: number): Promise<PermissionName[]> {
		const role = await this.orm.em.findOne(Role, { id: role_id });
		if (!role) throw new NotFoundException('Role not found');

		return role.permissions;
	}

	@UseRequestContext()
	async editPermissionOfUser(user_id: number, modified: PermissionPatchDTO): Promise<Permission> {
		const user = await this.orm.em.findOne(User, { id: user_id });
		if (!user) throw new NotFoundException('User not found');

		const perm = await this.orm.em.findOne(Permission, { id: modified.id });
		if (!perm) throw new NotFoundException('Permission not found on this user');

		if (modified.name) perm.name = modified.name;
		if (modified.expires) perm.expires = modified.expires;
		if (modified.revoked) perm.revoked = modified.revoked;

		await this.orm.em.persistAndFlush(perm);
		return perm;
	}
}

import type { I18nTranslations, PermissionEntity, PermissionName } from '@types';

import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { I18nService } from 'nestjs-i18n';

import { idNotFound, permissionAlreadyOnUser, permissionInvalid, permissionNotFoundOnUser } from '@utils/responses';
import { validateObject } from '@utils/validate';
import { PERMISSIONS_NAMES } from 'src/types/api/permissions/perms';

import { PermissionPatchDTO } from './dto/patch.dto';
import { PermissionPostDTO, RolePermissionsDto } from './dto/post.dto';
import { Permission } from './entities/permission.entity';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PermissionsService {
	constructor(private readonly orm: MikroORM, private readonly i18n: I18nService<I18nTranslations>) {}

	/**
	 * Automatically revoke permissions that have expired.
	 * - Runs every 10 minutes
	 */
	@Cron('0 */10 * * * *')
	@UseRequestContext()
	async revokeExpiredPermissions(): Promise<void> {
		const permissions = await this.orm.em.find(Permission, { expires: { $lte: new Date() }, revoked: false });

		permissions.map((p) => {
			p.revoked = true;
			p.updated_at = new Date();

			return p;
		});

		await this.orm.em.persistAndFlush(permissions);
	}

	/**
	 * Add a permission to a user
	 * @param {PermissionPatchDTO} data The permission data to add
	 * @returns {Promise<PermissionEntity<number>>} The created permission
	 */
	@UseRequestContext()
	async addPermissionToUser(data: PermissionPostDTO): Promise<PermissionEntity<number>> {
		// Validate the data object
		validateObject({
			object: data,
			type: PermissionPostDTO,
			requiredKeys: ['expires', 'id', 'permission'],
			i18n: this.i18n,
		});

		// Check if the permission is valid
		if (!PERMISSIONS_NAMES.includes(data.permission))
			throw new BadRequestException(permissionInvalid({ i18n: this.i18n, permission: data.permission }));

		// Find the user
		const user = await this.orm.em.findOne(User, { id: data.id });
		if (!user) throw new NotFoundException(idNotFound({ i18n: this.i18n, type: User, id: data.id }));

		// Check if the user already has the permission
		await user.permissions.init();
		if (
			user.permissions
				.getItems()
				.map((p) => p.name)
				.includes(data.permission)
		)
			throw new BadRequestException(
				permissionAlreadyOnUser({ i18n: this.i18n, permission: data.permission, user: user.full_name }),
			);

		// Add the permission to the user
		const permission = this.orm.em.create(Permission, {
			name: data.permission,
			user,
			expires: data.expires,
			revoked: false,
		});

		// Save it & return it
		await this.orm.em.persistAndFlush(permission);
		return { ...permission, user: user.id };
	}

	/**
	 * Add a permission to an existing role
	 * @param {PermissionName[]} permissions The permission name in caps
	 * @param {number} id the role id to which the permission should be added
	 * @returns {Promise<Role>}
	 */
	@UseRequestContext()
	async addPermissionsToRole(permissions: PermissionName[], id: number): Promise<Role> {
		validateObject({
			object: { permissions: permissions, id: id },
			type: RolePermissionsDto,
			requiredKeys: ['permissions', 'id'],
			i18n: this.i18n,
		});

		const role = await this.orm.em.findOne(Role, { id: id });
		if (!role) throw new NotFoundException(idNotFound({ i18n: this.i18n, type: Role, id }));

		permissions.forEach((n) => {
			if (!PERMISSIONS_NAMES.includes(n))
				throw new BadRequestException(permissionInvalid({ i18n: this.i18n, permission: n }));

			if (!role.permissions.includes(n)) {
				role.permissions.push(n);
			}
		});

		await this.orm.em.persistAndFlush(role);
		return role;
	}

	/**
	 * Get all permissions of a user
	 * @param input Arguments for the query
	 * @returns {Promise<Permission[]>} The permissions of the user
	 */
	@UseRequestContext()
	async getPermissionsOfUser(id: number, revoked?: boolean): Promise<Permission[]> {
		const user = await this.orm.em.findOne(User, { id });
		if (!user) throw new NotFoundException(idNotFound({ i18n: this.i18n, type: User, id }));

		const permissions = await user.permissions.loadItems();
		if (revoked) permissions.filter((p) => p.revoked === false);

		return permissions;
	}

	/**
	 * Get all permissions attached to a role
	 * @param {number} role_id The role id
	 * @returns {Promise<PermissionName[]>} The permissions of the role
	 */
	@UseRequestContext()
	async getPermissionsOfRole(role_id: number): Promise<PermissionName[]> {
		const role = await this.orm.em.findOne(Role, { id: role_id });
		if (!role) throw new NotFoundException(idNotFound({ i18n: this.i18n, type: Role, id: role_id }));

		return role.permissions;
	}

	@UseRequestContext()
	async editPermissionOfUser(data: PermissionPatchDTO): Promise<Permission> {
		const user = await this.orm.em.findOne(User, { id: data.user_id });
		if (!user) throw new NotFoundException(idNotFound({ i18n: this.i18n, type: User, id: data.user_id }));

		const perm = await this.orm.em.findOne(Permission, { id: data.id, user });
		if (!perm)
			throw new NotFoundException(
				permissionNotFoundOnUser({ i18n: this.i18n, user: user.full_name, permission: data.name }),
			);

		if (data.name) perm.name = data.name;
		if (data.expires) perm.expires = data.expires;
		if (data.revoked !== undefined) perm.revoked = data.revoked;

		await this.orm.em.persistAndFlush(perm);
		return perm;
	}
}

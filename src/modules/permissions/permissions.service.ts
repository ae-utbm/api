import type { I18nTranslations, PermissionEntity } from '@types';

import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { I18nService } from 'nestjs-i18n';

import { Errors } from '@i18n';
import { validateObject } from '@utils/validate';
import { PERMISSIONS_NAMES } from 'src/types/api/permissions/perms';

import { PermissionPatchDTO } from './dto/patch.dto';
import { PermissionPostDTO } from './dto/post.dto';
import { Permission } from './entities/permission.entity';
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
			throw new BadRequestException(Errors.Permission.Invalid({ i18n: this.i18n, permission: data.permission }));

		// Find the user
		const user = await this.orm.em.findOne(User, { id: data.id });
		if (!user) throw new NotFoundException(Errors.Generic.IdNotFound({ i18n: this.i18n, type: User, id: data.id }));

		// Check if the user already has the permission
		await user.permissions.init();
		if (
			user.permissions
				.getItems()
				.map((p) => p.name)
				.includes(data.permission)
		)
			throw new BadRequestException(
				Errors.Permission.AlreadyOnUser({ i18n: this.i18n, permission: data.permission, user: user.full_name }),
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
	 * Get all permissions of a user
	 * @param {number} id User id
	 * @returns {Promise<Permission[]>} The permissions of the user
	 */
	@UseRequestContext()
	async getPermissionsOfUser(id: number): Promise<Permission[]> {
		const user = await this.orm.em.findOne(User, { id });
		if (!user) throw new NotFoundException(Errors.Generic.IdNotFound({ i18n: this.i18n, type: User, id }));

		return user.permissions.loadItems();
	}

	@UseRequestContext()
	async editPermissionOfUser(data: PermissionPatchDTO): Promise<Permission> {
		const user = await this.orm.em.findOne(User, { id: data.user_id });
		if (!user)
			throw new NotFoundException(Errors.Generic.IdNotFound({ i18n: this.i18n, type: User, id: data.user_id }));

		const perm = await this.orm.em.findOne(Permission, { id: data.id, user });
		if (!perm)
			throw new NotFoundException(
				Errors.Permission.NotFoundOnUser({ i18n: this.i18n, user: user.full_name, permission: data.name }),
			);

		if (data.name) perm.name = data.name;
		if (data.expires) perm.expires = data.expires;
		if (data.revoked !== undefined) perm.revoked = data.revoked;

		await this.orm.em.persistAndFlush(perm);
		return perm;
	}
}

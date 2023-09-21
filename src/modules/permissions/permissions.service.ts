import type { PermissionEntity } from '#types/api';

import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PERMISSIONS_NAMES } from '@exported/api/constants/perms';
import { TranslateService } from '@modules/translate/translate.service';

import { PermissionPatchDTO } from './dto/patch.dto';
import { PermissionPostDTO } from './dto/post.dto';
import { Permission } from './entities/permission.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PermissionsService {
	constructor(private readonly orm: MikroORM, private readonly t: TranslateService) {}

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
			p.updated = new Date();

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
		// Check if the permission is valid
		if (!PERMISSIONS_NAMES.includes(data.permission))
			throw new BadRequestException(this.t.Errors.Permission.Invalid(data.permission));

		// Find the user
		const user = await this.orm.em.findOne(User, { id: data.id }, { populate: ['permissions'] });
		if (!user) throw new NotFoundException(this.t.Errors.Id.NotFound(User, data.id));

		// Check if the user already has the permission
		if (
			user.permissions
				.getItems()
				.map((p) => p.name)
				.includes(data.permission)
		)
			throw new BadRequestException(this.t.Errors.Permission.AlreadyOnUser(data.permission, user.full_name));

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
		if (!user) throw new NotFoundException(this.t.Errors.Id.NotFound(User, id));

		return user.permissions.loadItems();
	}

	@UseRequestContext()
	async editPermissionOfUser(data: PermissionPatchDTO): Promise<Permission> {
		const user = await this.orm.em.findOne(User, { id: data.user_id });
		if (!user) throw new NotFoundException(this.t.Errors.Id.NotFound(User, data.user_id));

		const perm = await this.orm.em.findOne(Permission, { id: data.id, user });
		if (!perm) throw new NotFoundException(this.t.Errors.Permission.NotFoundOnUser(data.name, user.full_name));

		if (data.name) perm.name = data.name;
		if (data.expires) perm.expires = data.expires;
		if (data.revoked !== undefined) perm.revoked = data.revoked;

		await this.orm.em.persistAndFlush(perm);
		return perm;
	}
}

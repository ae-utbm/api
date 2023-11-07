import { MikroORM, CreateRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { i18nBadRequestException, i18nNotFoundException } from '@modules/_mixin/http-errors';

import { InputUpdatePermissionDTO, InputCreatePermissionDTO } from './dto/input.dto';
import { OutputPermissionDTO } from './dto/output.dto';
import { Permission } from './entities/permission.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PermissionsService {
	constructor(private readonly orm: MikroORM) {}

	/**
	 * Automatically revoke permissions that have expired.
	 * - Runs every 10 minutes
	 */
	@Cron('0 */10 * * * *')
	@CreateRequestContext()
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
	 * @param data The permission data to add
	 * @returns The created permission
	 */
	@CreateRequestContext()
	async addPermissionToUser(data: InputCreatePermissionDTO): Promise<OutputPermissionDTO> {
		// Find the user
		const user = await this.orm.em.findOne(User, { id: data.id }, { populate: ['permissions'] });
		if (!user) throw new i18nNotFoundException('validations.user.not_found.id', { id: data.id });

		// Check if the user already has the permission
		if (
			user.permissions
				.getItems()
				.map((p) => p.name)
				.includes(data.permission)
		)
			throw new i18nBadRequestException('validations.permission.invalid.already_on', {
				permission: data.permission,
				name: user.full_name,
			});

		// Add the permission to the user
		const permission = this.orm.em.create(Permission, {
			name: data.permission,
			user,
			expires: data.expires,
			revoked: false,
		});

		// Save it & return it
		await this.orm.em.persistAndFlush(permission);
		return permission.toObject() as unknown as OutputPermissionDTO;
	}

	/**
	 * Get all permissions of a user
	 * @param {number} id User id
	 * @returns {Promise<Permission[]>} The permissions of the user
	 */
	@CreateRequestContext()
	async getPermissionsOfUser(id: number): Promise<OutputPermissionDTO[]> {
		const user = await this.orm.em.findOne(User, { id });
		if (!user) throw new i18nNotFoundException('validations.user.not_found.id', { id });

		const permissions = await user.permissions.loadItems();
		return permissions.map((p) => p.toObject() as unknown as OutputPermissionDTO);
	}

	@CreateRequestContext()
	async editPermissionOfUser(data: InputUpdatePermissionDTO): Promise<OutputPermissionDTO> {
		const user = await this.orm.em.findOne(User, { id: data.user_id });
		if (!user) throw new i18nNotFoundException('validations.user.not_found.id', { id: data.user_id });

		const perm = await this.orm.em.findOne(Permission, { id: data.id, user: data.user_id });
		if (!perm)
			throw new i18nNotFoundException('validations.permission.not_found', { id: data.id, name: user.full_name });

		if (data.name) perm.name = data.name;
		if (data.expires) perm.expires = data.expires;
		if (data.revoked !== undefined) perm.revoked = data.revoked;

		await this.orm.em.persistAndFlush(perm);
		return perm.toObject() as unknown as OutputPermissionDTO;
	}
}

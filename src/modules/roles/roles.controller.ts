import type { I18nTranslations } from '@types';

import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
	ApiTags,
	ApiBearerAuth,
	ApiOkResponse,
	ApiUnauthorizedResponse,
	ApiOperation,
	ApiBadRequestResponse,
	ApiNotFoundResponse,
} from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';

import { Errors } from '@i18n';
import { GuardPermissions } from '@modules/auth/decorators/permissions.decorator';
import { PermissionGuard } from '@modules/auth/guards/permission.guard';
import { BaseUserResponseDTO } from '@modules/users/dto/base-user.dto';
import { validateObject } from '@utils/validate';

import { RolePatchDTO } from './dto/patch.dto';
import { RolePostDTO } from './dto/post.dto';
import { Role } from './entities/role.entity';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@Controller('roles')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class RolesController {
	constructor(private readonly rolesService: RolesService, private readonly i18n: I18nService<I18nTranslations>) {}

	@Post()
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_ROLE')
	@ApiOperation({ summary: 'Create a new role' })
	@ApiOkResponse({ type: Role })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	@ApiBadRequestResponse({ description: 'Role name is not uppercase or already exists' })
	async createRole(@Body() body: RolePostDTO) {
		validateObject({
			objectToValidate: body,
			objectType: RolePostDTO,
			requiredKeys: ['name', 'permissions', 'expires'],
			i18n: this.i18n,
		});

		return this.rolesService.createRole(body.name, body.permissions, body.expires);
	}

	@Patch()
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_ROLE')
	@ApiOperation({ summary: 'Update an existing role' })
	@ApiOkResponse({ type: Role })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	@ApiBadRequestResponse({ description: 'Role name is not uppercase' })
	@ApiNotFoundResponse({ description: 'Role not found' })
	async editRole(@Body() body: RolePatchDTO) {
		validateObject({
			objectToValidate: body,
			objectType: RolePostDTO,
			requiredKeys: ['id'],
			optionalKeys: ['name', 'permissions', 'expires'],
			i18n: this.i18n,
		});

		return this.rolesService.editRole(body);
	}

	@Get()
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_ROLE')
	@ApiOperation({ summary: 'Get all existing roles' })
	@ApiOkResponse({ type: [Role] })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async getAllRoles() {
		return this.rolesService.getAllRoles();
	}

	@Get(':role_id')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_ROLE')
	@ApiOperation({ summary: 'Get the specified role' })
	@ApiOkResponse({ type: Role })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	@ApiNotFoundResponse({ description: 'Role not found' })
	async getRole(@Param('role_id') id: number) {
		if (typeof id !== 'number' && parseInt(id, 10) != id)
			throw new BadRequestException(Errors.Generic.FieldInvalid({ i18n: this.i18n, type: Number, field: 'id' }));

		return this.rolesService.getRole(id);
	}

	@Get(':role_id/users')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_ROLE')
	@ApiOperation({ summary: 'Get user of the specified role' })
	@ApiOkResponse({ type: [BaseUserResponseDTO] })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	@ApiNotFoundResponse({ description: 'Role not found' })
	async getRoleUsers(@Param('role_id') id: number) {
		if (typeof id !== 'number' && parseInt(id, 10) != id)
			throw new BadRequestException(Errors.Generic.FieldInvalid({ i18n: this.i18n, type: Number, field: 'id' }));

		return this.rolesService.getUsers(id);
	}

	@Post(':role_id/users/:user_id')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_ROLE')
	@ApiOperation({ summary: 'Add a user to the role' })
	@ApiOkResponse({ type: [BaseUserResponseDTO] })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	@ApiNotFoundResponse({ description: 'Role or user not found' })
	async addUserToRole(@Param('role_id') role_id: number, @Param('user_id') user_id: number) {
		if (typeof role_id !== 'number' && parseInt(role_id, 10) != role_id)
			throw new BadRequestException(Errors.Generic.FieldInvalid({ i18n: this.i18n, type: Number, field: 'role_id' }));

		if (typeof user_id !== 'number' && parseInt(user_id, 10) != user_id)
			throw new BadRequestException(Errors.Generic.FieldInvalid({ i18n: this.i18n, type: Number, field: 'user_id' }));

		return this.rolesService.addUser(role_id, user_id);
	}

	@Delete(':role_id/users/:user_id')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_ROLE')
	@ApiOperation({ summary: 'Remove a user from the role' })
	@ApiOkResponse({ type: [BaseUserResponseDTO] })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	@ApiNotFoundResponse({ description: 'Role or user not found' })
	async removeUserToRole(@Param('role_id') role_id: number, @Param('user_id') user_id: number) {
		if (typeof role_id !== 'number' && parseInt(role_id, 10) != role_id)
			throw new BadRequestException(Errors.Generic.FieldInvalid({ i18n: this.i18n, type: Number, field: 'role_id' }));

		if (typeof user_id !== 'number' && parseInt(user_id, 10) != user_id)
			throw new BadRequestException(Errors.Generic.FieldInvalid({ i18n: this.i18n, type: Number, field: 'user_id' }));

		return this.rolesService.removeUser(role_id, user_id);
	}
}

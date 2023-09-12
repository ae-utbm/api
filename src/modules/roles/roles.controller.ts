import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
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
import { z } from 'zod';

import { GuardPermissions } from '@modules/auth/decorators/permissions.decorator';
import { PermissionGuard } from '@modules/auth/guards/permission.guard';
import { TranslateService } from '@modules/translate/translate.service';
import { BaseUserResponseDTO } from '@modules/users/dto/base-user.dto';
import { validate } from '@utils/validate';

import { RoleEditUsersDTO, RolePatchDTO } from './dto/patch.dto';
import { RolePostDTO } from './dto/post.dto';
import { Role } from './entities/role.entity';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@Controller('roles')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class RolesController {
	constructor(private readonly rolesService: RolesService, private readonly t: TranslateService) {}

	@Post()
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_ROLE')
	@ApiOperation({ summary: 'Create a new role' })
	@ApiOkResponse({ type: Role })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	@ApiBadRequestResponse({ description: 'Role name is not uppercase or already exists' })
	async createRole(@Body() body: RolePostDTO) {
		const schema = z
			.object({
				name: z.string().refine((name) => name === name.toUpperCase(), {}),
				permissions: z.array(z.string()),
				expires: z.string().datetime(),
			})
			.strict();
		validate(schema, body);

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
		const schema = z
			.object({
				id: z.number(),
				name: z
					.string()
					.refine((name) => name === name.toUpperCase(), {})
					.optional(),
				permissions: z.array(z.string()).optional(),
				expires: z.string().datetime().optional(),
			})
			.strict();
		validate(schema, body);

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
		validate(z.coerce.number().int().min(1), id);

		return this.rolesService.getRole(id);
	}

	@Get(':role_id/users')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_ROLE')
	@ApiOperation({ summary: 'Get user(s) of the specified role' })
	@ApiOkResponse({ type: [BaseUserResponseDTO] })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	@ApiNotFoundResponse({ description: 'Role not found' })
	async getRoleUsers(@Param('role_id') id: number) {
		validate(z.coerce.number().int().min(1), id);

		return this.rolesService.getUsers(id);
	}

	@Post(':role_id/users')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_ROLE')
	@ApiOperation({ summary: 'Add user(s) to the role' })
	@ApiOkResponse({ type: [BaseUserResponseDTO] })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	@ApiNotFoundResponse({ description: 'Role not found' })
	async addUsersToRole(@Param('role_id') role_id: number, @Body() body: RoleEditUsersDTO) {
		validate(z.coerce.number().int().min(1), role_id);

		const schema = z
			.object({
				users: z.array(z.number().int().min(1).positive()).min(1),
			})
			.strict();
		validate(schema, body);

		return this.rolesService.addUsers(role_id, body.users);
	}

	@Delete(':role_id/users')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_ROLE')
	@ApiOperation({ summary: 'Remove user(s) from the role' })
	@ApiOkResponse({ type: [BaseUserResponseDTO] })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	@ApiNotFoundResponse({ description: 'Role not found' })
	async removeUsersToRole(@Param('role_id') role_id: number, @Body('') body: RoleEditUsersDTO) {
		validate(z.coerce.number().int().min(1), role_id);

		const schema = z
			.object({
				users: z.array(z.number().int().min(1).positive()).min(1),
			})
			.strict();
		validate(schema, body);

		return this.rolesService.removeUsers(role_id, body.users);
	}
}

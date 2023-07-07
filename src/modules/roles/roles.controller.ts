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

import { GuardPermissions } from '@modules/auth/decorators/permissions.decorator';
import { PermissionGuard } from '@modules/auth/guards/permission.guard';
import { BaseUserResponseDTO } from '@modules/users/dto/base-user.dto';

import { RolePatchDTO } from './dto/patch.dto';
import { RolePostDTO } from './dto/post.dto';
import { Role } from './entities/role.entity';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@Controller('roles')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class RolesController {
	constructor(private readonly rolesService: RolesService) {}

	@Post()
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_ROLE')
	@ApiOperation({ summary: 'Create a new role' })
	@ApiOkResponse({ type: Role })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	@ApiBadRequestResponse({ description: 'Role name is not uppercase or already exists' })
	async createRole(@Body() body: RolePostDTO) {
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
		return this.rolesService.editRole(body);
	}

	@Get()
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_ROLE')
	@ApiOperation({ summary: 'Get all existing roles' })
	@ApiOkResponse({ type: [Role] })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async getAllRoles() {
		return this.rolesService.getAllRoles({ show_expired: true, show_revoked: true });
	}

	@Get(':role_id/users')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_ROLE')
	@ApiOperation({ summary: 'Get user of the specified role' })
	@ApiOkResponse({ type: [BaseUserResponseDTO] })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	@ApiNotFoundResponse({ description: 'Role not found' })
	async getRoleUsers(@Param('role_id') id: number) {
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
		return this.rolesService.removeUser(role_id, user_id);
	}
}

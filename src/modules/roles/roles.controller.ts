import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOkResponse, ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger';
import { z } from 'zod';

import { ApiNotOkResponses } from '@modules/_mixin/decorators/error.decorator';
import { GuardPermissions } from '@modules/auth/decorators/permissions.decorator';
import { PermissionGuard } from '@modules/auth/guards/permission.guard';
import { TranslateService } from '@modules/translate/translate.service';
import { validate } from '@utils/validate';

import { RoleGetDTO, RoleUsersResponseDTO } from './dto/get.dto';
import { RoleEditUserDTO, RolePatchDTO } from './dto/patch.dto';
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
	@ApiOkResponse({ type: RoleGetDTO })
	@ApiNotOkResponses({ 400: 'Role name is not uppercase or already exists' })
	async createRole(@Body() body: RolePostDTO) {
		const schema = z
			.object({
				name: z.string().refine((name) => name === name.toUpperCase(), {}),
				permissions: z.array(z.string()),
			})
			.strict();
		validate(schema, body);

		return this.rolesService.createRole(body.name, body.permissions);
	}

	@Patch()
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_ROLE')
	@ApiOperation({ summary: 'Update an existing role' })
	@ApiOkResponse({ type: RoleGetDTO })
	@ApiNotOkResponses({ 400: 'Role name is not uppercase', 404: 'Role not found' })
	async editRole(@Body() body: RolePatchDTO) {
		const schema = z
			.object({
				id: z.number(),
				name: z
					.string()
					.refine((name) => name === name.toUpperCase(), {})
					.optional(),
				permissions: z.array(z.string()).optional(),
			})
			.strict();
		validate(schema, body);

		return this.rolesService.editRole(body);
	}

	@Get()
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_ROLE')
	@ApiOperation({ summary: 'Get all existing roles' })
	@ApiOkResponse({ type: [RoleGetDTO] })
	async getAllRoles() {
		return this.rolesService.getAllRoles();
	}

	@Get(':role_id')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_ROLE')
	@ApiOperation({ summary: 'Get the specified role' })
	@ApiParam({ name: 'role_id', description: 'The role ID' })
	@ApiOkResponse({ type: RoleGetDTO })
	@ApiNotOkResponses({ 400: 'Invalid role ID', 404: 'Role not found' })
	async getRole(@Param('role_id') id: number) {
		validate(z.coerce.number().int().min(1), id, this.t.Errors.Id.Invalid(Role, id));

		return this.rolesService.getRole(id);
	}

	@Get(':role_id/users')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_ROLE')
	@ApiOperation({ summary: 'Get user(s) of the specified role' })
	@ApiParam({ name: 'role_id', description: 'The role ID' })
	@ApiOkResponse({ type: [RoleUsersResponseDTO] })
	@ApiNotOkResponses({ 400: 'Invalid role ID', 404: 'Role not found' })
	async getRoleUsers(@Param('role_id') id: number) {
		validate(z.coerce.number().int().min(1), id, this.t.Errors.Id.Invalid(Role, id));

		return this.rolesService.getUsers(id);
	}

	@Post(':role_id/users')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_ROLE')
	@ApiOperation({ summary: 'Add user(s) to the role' })
	@ApiParam({ name: 'role_id', description: 'The role ID' })
	@ApiOkResponse({ type: [RoleUsersResponseDTO] })
	@ApiNotOkResponses({ 400: 'Invalid role ID or body', 404: 'Role not found' })
	@ApiBody({ type: [RoleEditUserDTO] })
	async addUsersToRole(@Param('role_id') role_id: number, @Body() body: RoleEditUserDTO[]) {
		validate(z.coerce.number().int().min(1), role_id, this.t.Errors.Id.Invalid(Role, role_id));

		const schema = z
			.object({
				id: z.number().int().min(1).positive(),
				expires: z.string().datetime(),
			})
			.strict();
		validate(z.array(schema).min(1), body);

		return this.rolesService.addUsers(role_id, body);
	}

	@Delete(':role_id/users')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_ROLE')
	@ApiOperation({ summary: 'Remove user(s) from the role' })
	@ApiParam({ name: 'role_id', description: 'The role ID' })
	@ApiOkResponse({ type: [RoleUsersResponseDTO] })
	@ApiNotOkResponses({ 400: 'Invalid role ID or given users IDs', 404: 'Role not found' })
	@ApiBody({ type: [Number] })
	async removeUsersToRole(@Param('role_id') role_id: number, @Body() body: number[]) {
		validate(z.coerce.number().int().min(1), role_id, this.t.Errors.Id.Invalid(Role, role_id));

		const schema = z.array(z.number().min(1)).min(1);
		validate(schema, body);

		return this.rolesService.removeUsers(role_id, body);
	}
}

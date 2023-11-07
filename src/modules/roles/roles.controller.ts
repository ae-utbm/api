import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOkResponse, ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger';

import { ApiNotOkResponses } from '@modules/_mixin/decorators/api-not-ok.decorator';
import { InputIdParamDTO } from '@modules/_mixin/dto/input.dto';
import { GuardPermissions } from '@modules/auth/decorators/permissions.decorator';
import { PermissionGuard } from '@modules/auth/guards/permission.guard';

import {
	InputUpdateRoleDTO,
	InputCreateRoleDTO,
	InputUpdateRoleUsersDTO,
	InputDeleteRoleUsersDTO,
} from './dto/input.dto';
import { OutputRoleDTO, OutputRoleUserDTO } from './dto/output.dto';
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
	@ApiOkResponse({ type: OutputRoleDTO })
	@ApiNotOkResponses({ 400: 'Role name is not uppercase or already exists' })
	async createRole(@Body() body: InputCreateRoleDTO) {
		return this.rolesService.createRole(body.name, body.permissions);
	}

	@Patch()
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_ROLE')
	@ApiOperation({ summary: 'Update an existing role' })
	@ApiOkResponse({ type: OutputRoleDTO })
	@ApiNotOkResponses({ 400: 'Role name is not uppercase', 404: 'Role not found' })
	async editRole(@Body() body: InputUpdateRoleDTO) {
		return this.rolesService.editRole(body);
	}

	@Get()
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_ROLE')
	@ApiOperation({ summary: 'Get all existing roles' })
	@ApiOkResponse({ type: [OutputRoleDTO] })
	async getAllRoles() {
		return this.rolesService.getAllRoles();
	}

	@Get(':id')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_ROLE')
	@ApiOperation({ summary: 'Get the specified role' })
	@ApiParam({ name: 'id', description: 'The role ID' })
	@ApiOkResponse({ type: OutputRoleDTO })
	@ApiNotOkResponses({ 400: 'Invalid role ID', 404: 'Role not found' })
	async getRole(@Param() params: InputIdParamDTO) {
		return this.rolesService.getRole(params.id);
	}

	@Get(':id/users')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_ROLE')
	@ApiOperation({ summary: 'Get user(s) of the specified role' })
	@ApiParam({ name: 'role_id', description: 'The role ID' })
	@ApiOkResponse({ type: [OutputRoleUserDTO] })
	@ApiNotOkResponses({ 400: 'Invalid role ID', 404: 'Role not found' })
	async getRoleUsers(@Param() params: InputIdParamDTO) {
		return this.rolesService.getUsers(params.id);
	}

	@Post(':id/users')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_ROLE')
	@ApiOperation({ summary: 'Add user(s) to the role' })
	@ApiParam({ name: 'id', description: 'The role ID' })
	@ApiOkResponse({ type: [OutputRoleUserDTO] })
	@ApiNotOkResponses({ 400: 'Invalid role ID or body', 404: 'Role not found' })
	@ApiBody({ type: [InputUpdateRoleUsersDTO] })
	async addUsersToRole(@Param() params: InputIdParamDTO, @Body() body: InputUpdateRoleUsersDTO) {
		return this.rolesService.addUsers(params.id, body.users);
	}

	@Delete(':id/users')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_ROLE')
	@ApiOperation({ summary: 'Remove user(s) from the role' })
	@ApiParam({ name: 'id', description: 'The role ID' })
	@ApiOkResponse({ type: [OutputRoleUserDTO] })
	@ApiNotOkResponses({ 400: 'Invalid role ID or given users IDs', 404: 'Role not found' })
	@ApiBody({ type: [Number] })
	async removeUsersToRole(@Param() params: InputIdParamDTO, @Body() body: InputDeleteRoleUsersDTO) {
		return this.rolesService.removeUsers(params.id, body.users);
	}
}

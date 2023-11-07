import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { ApiNotOkResponses } from '@modules/base/decorators/api-not-ok.decorator';
import { InputIdParamDTO } from '@modules/base/dto/input.dto';
import { OutputMessageDTO } from '@modules/base/dto/output.dto';
import { GuardPermissions } from '@modules/auth/decorators/permissions.decorator';
import { GuardSelfOrPermissions } from '@modules/auth/decorators/self-or-perms.decorator';
import { GuardSelfParam } from '@modules/auth/decorators/self.decorator';
import { InputRegisterUsersAdminDTO } from '@modules/auth/dto/input.dto';
import { PermissionGuard } from '@modules/auth/guards/permission.guard';
import { SelfOrPermissionGuard } from '@modules/auth/guards/self-or-perms.guard';
import { SelfGuard } from '@modules/auth/guards/self.guard';
import { OutputPermissionDTO } from '@modules/permissions/dto/output.dto';

import { InputUpdateUserDTO, InputUpdateUserVisibilityDTO } from '../dto/input.dto';
import { OutputUserDTO, OutputBaseUserDTO, OutputUserRoleDTO, OutputUserVisibilityDTO } from '../dto/output.dto';
import { Request } from '../entities/user.entity';
import { UsersDataService } from '../services/users-data.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UsersDataController {
	constructor(private readonly usersService: UsersDataService) {}

	@Post()
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_USER')
	@ApiOperation({ summary: 'Creates new users' })
	@ApiOkResponse({ description: 'The created user', type: [OutputBaseUserDTO] })
	@ApiNotOkResponses({ 400: 'Invalid input', 401: 'Insufficient permission' })
	@ApiBody({ type: [InputRegisterUsersAdminDTO] })
	async create(@Body() input: InputRegisterUsersAdminDTO): Promise<OutputBaseUserDTO[]> {
		return this.usersService.registerByAdmin(input.users);
	}

	@Patch(':id')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_EDIT_USER'])
	@ApiOperation({ summary: 'Update your account' })
	@ApiParam({ name: 'id', description: 'Your user ID' })
	@ApiOkResponse({ description: 'User data', type: OutputUserDTO })
	@ApiNotOkResponses({ 400: 'Invalid ID or input', 404: 'User not found' })
	async updateSelf(
		@Req() req: Request,
		@Param() params: InputIdParamDTO,
		@Body() body: InputUpdateUserDTO,
	): Promise<OutputUserDTO> {
		return this.usersService.update(req.user.id, params.id, body);
	}

	@Delete(':id')
	@UseGuards(SelfGuard)
	@GuardSelfParam('id')
	@ApiOperation({ summary: 'Delete your account' })
	@ApiParam({ name: 'id', description: 'Your user ID' })
	@ApiOkResponse({ description: 'User deleted', type: OutputMessageDTO })
	@ApiNotOkResponses({ 400: 'Invalid ID', 404: 'User not found' })
	async delete(@Param() params: InputIdParamDTO): Promise<OutputMessageDTO> {
		return this.usersService.delete(params.id);
	}

	@Get(':id/data')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER_PRIVATE'])
	@ApiOperation({ summary: 'Get all information of a user' })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiOkResponse({ description: 'User data', type: OutputUserDTO })
	@ApiNotOkResponses({ 400: 'Invalid ID', 404: 'User not found' })
	async getPrivate(@Param() params: InputIdParamDTO): Promise<OutputUserDTO> {
		return this.usersService.findOne(params.id, false);
	}

	@Get(':id/data/public')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER'])
	@ApiOperation({ summary: 'Get publicly available information of a user' })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiOkResponse({
		description: 'User data, excepted privates fields (set in the visibility table)',
		type: OutputUserDTO,
	})
	@ApiNotOkResponses({ 400: 'Invalid ID', 404: 'User not found' })
	async getPublic(@Param() params: InputIdParamDTO): Promise<OutputUserDTO> {
		return this.usersService.findOne(params.id, true);
	}

	@Get(':id/data/visibility')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER_PRIVATE'])
	@ApiOperation({ summary: 'Get visibility settings of a user' })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiOkResponse({ description: 'User data', type: OutputUserVisibilityDTO })
	@ApiNotOkResponses({ 400: 'Invalid ID', 404: 'User not found' })
	async getVisibility(@Param() params: InputIdParamDTO): Promise<OutputUserVisibilityDTO> {
		return (await this.usersService.findVisibilities(params.id))[0];
	}

	@Patch(':id/data/visibility')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_EDIT_USER'])
	@ApiOperation({ summary: 'Update visibility settings of a user' })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiOkResponse({ description: 'User data', type: OutputUserVisibilityDTO })
	@ApiNotOkResponses({ 400: 'Invalid ID or input', 404: 'User not found' })
	async updateVisibility(
		@Param() params: InputIdParamDTO,
		@Body() input: InputUpdateUserVisibilityDTO,
	): Promise<OutputUserVisibilityDTO> {
		return this.usersService.updateVisibility(params.id, input);
	}

	@Get(':id/roles')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER', 'CAN_READ_ROLE'])
	@ApiOperation({ summary: 'Get roles of a user' })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiOkResponse({ description: 'Roles of the user', type: [OutputUserRoleDTO] })
	@ApiNotOkResponses({ 400: 'Invalid ID', 404: 'User not found' })
	async getUserRoles(@Param() params: InputIdParamDTO): Promise<OutputUserRoleDTO[]> {
		return this.usersService.getUserRoles(params.id, { show_expired: true, show_revoked: true });
	}

	@Get(':id/permissions')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER', 'CAN_READ_PERMISSIONS_OF_USER'])
	@ApiOperation({ summary: 'Get permissions of a user' })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiOkResponse({ description: 'Permissions of the user', type: [OutputPermissionDTO] })
	@ApiNotOkResponses({ 400: 'Invalid ID', 404: 'User not found' })
	async getUserPermissions(@Param() params: InputIdParamDTO): Promise<OutputPermissionDTO[]> {
		return this.usersService.getUserPermissions(params.id, { show_expired: true, show_revoked: true });
	}
}

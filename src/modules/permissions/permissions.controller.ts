import { Body, Controller, Get, Param, Post, UseGuards, Patch } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { ApiNotOkResponses } from '@modules/base/decorators/api-not-ok.decorator';
import { InputIdParamDTO } from '@modules/base/dto/input.dto';
import { GuardPermissions } from '@modules/auth/decorators/permissions.decorator';
import { GuardSelfOrPermissions } from '@modules/auth/decorators/self-or-perms.decorator';
import { PermissionGuard } from '@modules/auth/guards/permission.guard';
import { SelfOrPermissionGuard } from '@modules/auth/guards/self-or-perms.guard';

import { InputUpdatePermissionDTO, InputCreatePermissionDTO } from './dto/input.dto';
import { OutputPermissionDTO } from './dto/output.dto';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
@UseGuards(AuthGuard('jwt'))
@ApiTags('Permissions')
@ApiBearerAuth()
export class PermissionsController {
	constructor(private readonly permsService: PermissionsService) {}

	@Post()
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_PERMISSIONS_OF_USER')
	@ApiOperation({ summary: 'Add a permission to a user' })
	@ApiOkResponse({ description: 'The added permission', type: OutputPermissionDTO })
	@ApiNotOkResponses({
		400: 'Bad request, invalid fields',
		404: 'User not found',
	})
	async addToUser(@Body() body: InputCreatePermissionDTO): Promise<OutputPermissionDTO> {
		return this.permsService.addPermissionToUser(body);
	}

	@Patch()
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_PERMISSIONS_OF_USER')
	@ApiOperation({ summary: 'Edit permission of a user' })
	@ApiOkResponse({ description: 'The modified user permission', type: OutputPermissionDTO })
	@ApiNotOkResponses({ 404: 'User/permission not found' })
	async editPermissionFromUser(@Body() body: InputUpdatePermissionDTO): Promise<OutputPermissionDTO> {
		return this.permsService.editPermissionOfUser(body);
	}

	@Get(':id')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_PERMISSIONS_OF_USER'])
	@ApiOperation({ summary: 'Get all permissions of a user (active, revoked and expired)' })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiOkResponse({ description: 'User permission(s) retrieved', type: [OutputPermissionDTO] })
	@ApiNotOkResponses({ 404: 'User not found' })
	async getUserPermissions(@Param() params: InputIdParamDTO): Promise<OutputPermissionDTO[]> {
		return this.permsService.getPermissionsOfUser(params.id);
	}
}

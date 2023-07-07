import { Body, Controller, Get, Param, Post, UseGuards, Patch } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
	ApiBearerAuth,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { GuardPermissions } from '@modules/auth/decorators/permissions.decorator';
import { PermissionGuard } from '@modules/auth/guards/permission.guard';
import { Role } from '@modules/roles/entities/role.entity';

import { PermissionPatchDTO } from './dto/patch.dto';
import { PermissionPostDTO } from './dto/post.dto';
import { Permission } from './entities/permission.entity';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
@UseGuards(AuthGuard('jwt'))
@ApiTags('Permissions')
@ApiBearerAuth()
export class PermissionsController {
	constructor(private readonly permsService: PermissionsService) {}

	@Post('user')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_PERMISSIONS_OF_USER')
	@ApiOperation({ summary: 'Add a permission to a user' })
	@ApiOkResponse({ description: 'The added permission', type: Permission })
	@ApiNotFoundResponse({ description: 'User not found' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	addToUser(@Body() body: PermissionPostDTO): Promise<Permission> {
		return this.permsService.addPermissionToUser(body.permission, body.id, body.expires);
	}

	@Patch('user')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_PERMISSIONS_OF_USER')
	@ApiOperation({ summary: 'Edit permission of a user' })
	@ApiNotFoundResponse({ description: 'User not found' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	@ApiOkResponse({ description: 'The modified user permission', type: Permission })
	removePermissionFromUser(@Body() body: PermissionPatchDTO) {
		return this.permsService.editPermissionOfUser(body.id, body);
	}

	@Get('user/:id')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_PERMISSIONS_OF_USER')
	@ApiOperation({ summary: 'Get all permissions of a user (active, revoked and expired)' })
	@ApiNotFoundResponse({ description: 'User not found' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	@ApiOkResponse({ description: 'User permissions retrieved', type: [Permission] })
	@ApiParam({ name: 'id', description: 'The user ID' })
	getUserPermissions(@Param('id') id: number) {
		return this.permsService.getPermissionsOfUser(id, { show_expired: true, show_revoked: true });
	}

	@Post('role')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_PERMISSIONS_OF_ROLE')
	@ApiOperation({ summary: 'Add a permission to a role' })
	@ApiOkResponse({ description: 'Permission added to role', type: Role })
	@ApiNotFoundResponse({ description: 'Role not found' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	addToRole(@Body() body: PermissionPostDTO) {
		return this.permsService.addPermissionToRole(body.permission, body.id);
	}

	@Get('role/:id')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_PERMISSIONS_OF_ROLE')
	@ApiOperation({ summary: 'Get all permissions of a role' })
	@ApiNotFoundResponse({ description: 'Role not found' })
	@ApiOkResponse({ description: 'Role permissions retrieved', type: String, isArray: true })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	@ApiParam({ name: 'id', description: 'The role ID' })
	getRolePermissions(@Param('id') id: number) {
		return this.permsService.getPermissionsOfRole(id);
	}
}

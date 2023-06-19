import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { PermissionGuard } from '@modules/auth/guards/permission.guard';
import { GuardPermissions } from '@modules/auth/decorators/permissions.decorator';
import { RolePatchDTO } from './dto/patch.dto';
import { RolePostDTO } from './dto/post.dto';

@ApiTags('Roles')
@Controller('roles')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class RolesController {
	constructor(private readonly rolesService: RolesService) {}

	@Post()
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_CREATE_ROLE')
	async createRole(@Body() body: RolePostDTO) {
		return this.rolesService.createRole(body.name, body.permissions, body.expires);
	}

	@Patch()
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_ROLE')
	async editRole(@Body() body: RolePatchDTO) {
		return this.rolesService.editRole(body);
	}

	@Get()
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_VIEW_ALL_ROLES')
	async getAllRoles() {
		return this.rolesService.getAllRoles({ show_expired: true, show_revoked: true });
	}

	@Get(':id/users')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_VIEW_ROLE_USERS')
	async getRoleUsers(@Param('id') id: number) {
		return this.rolesService.getRoleUsers(id);
	}
}

import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role } from './entities/role.entity';
import { RolesService } from './roles.service';
import { RoleObject } from './models/role.model';
import { PermissionGuard } from '../auth/guards/perms.guard';
import { UseGuards } from '@nestjs/common';
import { PermissionName, Permissions } from '@/modules/auth/decorators/perms.decorator';

@Resolver(() => Role)
@UseGuards(PermissionGuard)
export class RolesResolver {
	constructor(private readonly rolesService: RolesService) {}

	@Query(() => [RoleObject])
	@Permissions('CAN_READ_ALL_ROLES')
	getAllRoles() {
		return this.rolesService.getAllRoles();
	}

	@Query(() => [RoleObject])
	@Permissions('CAN_READ_USER_ROLES')
	getUserRoles() {
		return this.rolesService.getUserRoles();
	}

	@Mutation(() => RoleObject)
	@Permissions('CAN_CREATE_ROLE')
	createRole(
		@Args('name', { type: () => String }) name: Uppercase<string>,
		@Args('permissions', { type: () => [String] }) permissions: PermissionName[],
		@Args('expires') expires: Date,
	) {
		return this.rolesService.createRole({ name, permissions, expires });
	}
}

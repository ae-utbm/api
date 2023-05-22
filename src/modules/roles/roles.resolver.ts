import type { PermissionName } from '@types';

import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RolesService } from './roles.service';
import { RoleObject } from './models/role.object';
import { PermissionGuard } from '../auth/guards/perms.guard';
import { UseGuards } from '@nestjs/common';
import { Permissions } from '@modules/auth/decorators/perms.decorator';
import { PermissionArgs, PermissionArgsNoId } from '@modules/perms/models/perms.args';

@Resolver(() => RoleObject)
@UseGuards(PermissionGuard)
export class RolesResolver {
	constructor(private readonly rolesService: RolesService) {}

	@Mutation(() => RoleObject)
	@Permissions('CAN_CREATE_ROLE')
	createRole(
		@Args('name', { type: () => String }) name: Uppercase<string>,
		@Args('permissions', { type: () => [String] }) permissions: PermissionName[],
		@Args('expires') expires: Date,
	) {
		return this.rolesService.createRole(name, permissions, expires);
	}

	@Mutation(() => RoleObject)
	@Permissions('CAN_REVOKE_ROLE')
	revokeRole(@Args('role_id', { type: () => Int }) role_id: number) {
		return this.rolesService.revokeRole(role_id);
	}

	@Mutation(() => RoleObject)
	@Permissions('CAN_EDIT_EXPIRATION_OF_ROLE')
	editExpirationOfRole(@Args('role_id', { type: () => Int }) role_id: number, @Args('date') date: Date) {
		return this.rolesService.editExpirationOfRole(role_id, date);
	}

	@Query(() => [RoleObject])
	@Permissions('CAN_READ_ALL_ROLES')
	getAllRoles(@Args() input: PermissionArgsNoId) {
		return this.rolesService.getAllRoles(input);
	}

	@Query(() => [RoleObject])
	@Permissions('CAN_READ_ROLES_OF_USER')
	getUserRoles(@Args() input: PermissionArgs) {
		return this.rolesService.getUserRoles(input);
	}
}

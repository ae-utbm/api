import { PermissionName } from '@types';

import { Args, Int, Mutation, Resolver, Query } from '@nestjs/graphql';
import { PermissionsService } from './perms.service';
import { PermissionObject } from './models/perms.object';
import { Permissions } from '@modules/auth/decorators/perms.decorator';
import { UseGuards } from '@nestjs/common';
import { PermissionGuard } from '../auth/guards/perms.guard';
import { RawPermissionObject } from './models/raw-perms.object';
import { RoleObject } from '../roles/models/role.object';
import { PermissionArgs } from './models/perms.args';
import { Self } from '@modules/auth/decorators/self.decorator';
import { PermissionOrSelfGuard } from '@modules/auth/guards/self.guard';

@Resolver()
export class PermissionsResolver {
	constructor(private readonly permissionsService: PermissionsService) {}

	@Mutation(() => PermissionObject)
	@Permissions('CAN_EDIT_PERMISSIONS_OF_USER')
	@UseGuards(PermissionGuard)
	addPermissionToUser(
		@Args('name') name: PermissionName,
		@Args('user_id', { type: () => Int }) user_id: number,
		@Args('expires') expires: Date,
	) {
		return this.permissionsService.addPermissionToUser(name, user_id, expires);
	}

	@Mutation(() => RoleObject)
	@Permissions('CAN_EDIT_PERMISSIONS_OF_ROLE')
	@UseGuards(PermissionGuard)
	addPermissionToRole(@Args('name') name: PermissionName, @Args('role_id', { type: () => Int }) role_id: number) {
		return this.permissionsService.addPermissionToRole(name, role_id);
	}

	@Query(() => [RawPermissionObject])
	@Permissions('CAN_READ_ALL_PERMISSIONS')
	@UseGuards(PermissionGuard)
	getAllPermissions() {
		return this.permissionsService.getAllPermissions();
	}

	@Query(() => [PermissionObject])
	@Self('input.user_id')
	@Permissions('CAN_READ_PERMISSIONS_OF_USER')
	@UseGuards(PermissionOrSelfGuard)
	getPermissionsOfUser(@Args() input: PermissionArgs) {
		return this.permissionsService.getPermissionsOfUser(input);
	}

	@Query(() => [RawPermissionObject])
	@Permissions('CAN_READ_PERMISSIONS_OF_ROLE')
	@UseGuards(PermissionGuard)
	getPermissionsOfRole(@Args('role_id', { type: () => Int }) role_id: number) {
		return this.permissionsService.getPermissionsOfRole(role_id);
	}
}

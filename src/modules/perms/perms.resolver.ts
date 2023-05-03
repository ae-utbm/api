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

@Resolver()
@UseGuards(PermissionGuard)
export class PermissionsResolver {
	constructor(private readonly permissionsService: PermissionsService) {}

	@Mutation(() => PermissionObject)
	@Permissions('CAN_EDIT_PERMISSIONS_OF_USER')
	addPermissionToUser(
		@Args('name') name: PermissionName,
		@Args('user_id', { type: () => Int }) user_id: number,
		@Args('expires') expires: Date,
	) {
		return this.permissionsService.addPermissionToUser(name, user_id, expires);
	}

	@Mutation(() => RoleObject)
	@Permissions('CAN_EDIT_PERMISSIONS_OF_ROLE')
	addPermissionToRole(@Args('name') name: PermissionName, @Args('role_id', { type: () => Int }) role_id: number) {
		return this.permissionsService.addPermissionToRole(name, role_id);
	}

	@Query(() => [RawPermissionObject])
	@Permissions('CAN_READ_ALL_PERMISSIONS')
	getAllPermissions() {
		return this.permissionsService.getAllPermissions();
	}

	@Query(() => [PermissionObject])
	@Permissions('CAN_READ_PERMISSIONS_OF_USER')
	getPermissionsOfUser(@Args() input: PermissionArgs) {
		return this.permissionsService.getPermissionsOfUser(input);
	}

	@Query(() => [RawPermissionObject])
	@Permissions('CAN_READ_PERMISSIONS_OF_ROLE')
	getPermissionsOfRole(@Args('role_id', { type: () => Int }) role_id: number) {
		return this.permissionsService.getPermissionsOfRole(role_id);
	}
}

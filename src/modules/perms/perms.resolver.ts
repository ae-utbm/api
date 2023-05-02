import { Args, Int, Mutation, Resolver, Query } from '@nestjs/graphql';
import { PermissionsService } from './perms.service';
import { PermissionObject } from './models/perms.model';
import { Permissions, TPermission } from './decorators/perms.decorator';
import { UseGuards } from '@nestjs/common';
import { PermissionGuard } from './guards/perms.guard';

@Resolver()
@UseGuards(PermissionGuard)
export class PermissionsResolver {
	constructor(private readonly permissionsService: PermissionsService) {}

	@Mutation(() => PermissionObject)
	@Permissions('CAN_MANAGE_USER_PERMISSIONS')
	addPermission(
		@Args('name') name: TPermission,
		@Args('user_id', { type: () => Int }) user_id: number,
		@Args('expires') expires: Date,
	) {
		return this.permissionsService.addPermission(name, user_id, expires);
	}

	@Query(() => [PermissionObject])
	@Permissions('CAN_READ_USER_PERMISSIONS')
	getPermissions(
		@Args('user_id', { type: () => Int }) user_id: number,
		@Args('showExpired', { nullable: true }) showExpired?: boolean,
		@Args('showRevoked', { nullable: true }) showRevoked?: boolean,
	) {
		return this.permissionsService.getPermissions(user_id, showExpired, showRevoked);
	}
}

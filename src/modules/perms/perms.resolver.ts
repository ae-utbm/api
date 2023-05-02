import { Args, Int, Mutation, Resolver, Query } from '@nestjs/graphql';
import { PermissionsService } from './perms.service';
import { PermissionObject } from './models/perms.model';
import { Permissions, PermissionName } from '@/modules/auth/decorators/perms.decorator';
import { UseGuards } from '@nestjs/common';
import { PermissionGuard } from '../auth/guards/perms.guard';
import { RawPermissionObject } from './models/raw-perms.model';

@Resolver()
@UseGuards(PermissionGuard)
export class PermissionsResolver {
	constructor(private readonly permissionsService: PermissionsService) {}

	@Mutation(() => PermissionObject)
	@Permissions('CAN_MANAGE_USER_PERMISSIONS')
	addPermissionToUser(
		@Args('name') name: PermissionName,
		@Args('user_id', { type: () => Int }) user_id: number,
		@Args('expires') expires: Date,
	) {
		return this.permissionsService.addPermissionToUser(name, user_id, expires);
	}

	@Query(() => [PermissionObject])
	@Permissions('CAN_READ_USER_PERMISSIONS')
	getPermissionsOfUser(
		@Args('user_id', { type: () => Int }) user_id: number,
		@Args('showExpired', { nullable: true }) showExpired?: boolean,
		@Args('showRevoked', { nullable: true }) showRevoked?: boolean,
	) {
		return this.permissionsService.getPermissionsOfUser(user_id, showExpired, showRevoked);
	}

	@Query(() => [RawPermissionObject])
	@Permissions('CAN_READ_ALL_PERMISSIONS')
	getAllPermissions() {
		return this.permissionsService.getAllPermissions();
	}
}

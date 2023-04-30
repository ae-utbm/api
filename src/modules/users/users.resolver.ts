import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { UserObject } from './models/user.model';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UseGuards } from '@nestjs/common';
import { PermissionGuard } from '../perms/guards/perms.guard';
import { Permissions } from '../perms/decorators/perms.decorator';

@Resolver(() => User)
@UseGuards(PermissionGuard)
export class UsersResolver {
	constructor(private readonly usersService: UsersService) {}

	@Query(() => UserObject)
	@Permissions('CAN_READ_USERS')
	user(
		@Args('id', { type: () => Int, nullable: true }) id?: number,
		@Args('email', { nullable: true }) email?: string,
	) {
		if (!id && !email) throw new Error('Arguments must be one of ID or email.');
		return this.usersService.findOne({ id, email });
	}
}

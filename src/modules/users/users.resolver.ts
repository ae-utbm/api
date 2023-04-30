import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { UserObject } from './models/user.model';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UseGuards } from '@nestjs/common';
import { Permissions } from '../perms/decorators/perms.decorator';
import { PermissionOrSelfGuard } from '../perms/guards/self.guard';
import { Self } from '../perms/decorators/self.decorator';

@Resolver(() => User)
export class UsersResolver {
	constructor(private readonly usersService: UsersService) {}

	@Query(() => UserObject)
	@Self('id')
	@Permissions('CAN_READ_USERS')
	@UseGuards(PermissionOrSelfGuard)
	user(@Args('id', { type: () => Int }) id: number) {
		return this.usersService.findOne({ id });
	}
}

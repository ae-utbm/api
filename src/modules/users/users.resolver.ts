import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserObject } from './models/user.model';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UseGuards } from '@nestjs/common';
import { Permissions } from '@/modules/auth/decorators/perms.decorator';
import { PermissionOrSelfGuard } from '../auth/guards/self.guard';
import { Self } from '@/modules/auth/decorators/self.decorator';
import { UserEditInput } from './models/user-edit.model';

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

	@Query(() => [UserObject])
	@Permissions('CAN_READ_USERS')
	users() {
		return this.usersService.findAll();
	}

	@Mutation(() => UserObject)
	@Permissions('CAN_CREATE_USERS')
	async createUser(@Args('email') email: string, @Args('password') password: string) {
		return this.usersService.create({ email, password });
	}

	@Mutation(() => UserObject)
	@Self('id')
	@Permissions('CAN_UPDATE_USERS')
	@UseGuards(PermissionOrSelfGuard)
	async updateUser(@Args('input') input: UserEditInput) {
		return this.usersService.update(input);
	}

	@Mutation(() => Boolean)
	@Self('id')
	@Permissions('CAN_DELETE_USERS')
	@UseGuards(PermissionOrSelfGuard)
	async deleteUser(@Args('id', { type: () => Int }) id: number) {
		const user = await this.usersService.findOne({ id });
		await this.usersService.delete(user);
		return true;
	}
}

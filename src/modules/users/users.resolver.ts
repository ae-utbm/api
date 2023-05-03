import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserObject } from './models/user.object';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UseGuards } from '@nestjs/common';
import { Permissions } from '@modules/auth/decorators/perms.decorator';
import { PermissionOrSelfGuard } from '../auth/guards/self.guard';
import { Self } from '@modules/auth/decorators/self.decorator';
import { UserGroupedObject } from './models/user-grouped.object';
import { UserEditArgs } from './models/user-edit.args';
import { PermissionGuard } from '../auth/guards/perms.guard';
import { UserRegisterArgs } from './models/user-register.args';

@Resolver(() => User)
export class UsersResolver {
	constructor(private readonly usersService: UsersService) {}

	@Query(() => UserObject)
	@Self('id')
	@Permissions('CAN_READ_USER')
	@UseGuards(PermissionOrSelfGuard)
	user(@Args('id', { type: () => Int }) id: number) {
		return this.usersService.findOne({ id });
	}

	@Query(() => [UserGroupedObject])
	@Permissions('CAN_READ_USER')
	@UseGuards(PermissionGuard)
	async users() {
		return this.usersService.findAll();
	}

	@Mutation(() => UserObject)
	@Permissions('CAN_CREATE_USER')
	@UseGuards(PermissionGuard)
	async createUser(@Args() input: UserRegisterArgs) {
		return this.usersService.create(input);
	}

	@Mutation(() => UserObject)
	@Self('id')
	@Permissions('CAN_UPDATE_USER')
	@UseGuards(PermissionOrSelfGuard)
	async updateUser(@Args() input: UserEditArgs) {
		return this.usersService.update(input);
	}

	@Mutation(() => Boolean)
	@Self('id')
	@Permissions('CAN_DELETE_USER')
	@UseGuards(PermissionOrSelfGuard)
	async deleteUser(@Args('id', { type: () => Int }) id: number) {
		const user = await this.usersService.findOne({ id }, false);
		await this.usersService.delete(user);
		return true;
	}
}

import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { UseGuards } from '@nestjs/common';
import { Permissions } from '@modules/auth/decorators/perms.decorator';
import { PermissionOrSelfGuard } from '../auth/guards/self.guard';
import { Self } from '@modules/auth/decorators/self.decorator';
import { UserEditArgs } from './models/user-edit.args';
import { PermissionGuard } from '../auth/guards/perms.guard';
import { UserRegisterArgs } from './models/user-register.args';
import { DateObject } from '@database/models/date.object';
import { UserObject } from './models/user.object';
import { UserVisibilityObject } from './models/user-visibility.object';

@Resolver(() => UserObject)
export class UsersResolver {
	constructor(private readonly usersService: UsersService) {}

	@Query(() => UserObject)
	@Self('id')
	@Permissions('CAN_READ_USER_PUBLIC')
	@UseGuards(PermissionOrSelfGuard)
	async userPublic(@Args('id', { type: () => Int }) id: number) {
		return this.usersService.findOne({ id });
	}

	@Query(() => UserObject)
	@Self('id')
	@Permissions('CAN_READ_USER_PRIVATE')
	@UseGuards(PermissionOrSelfGuard)
	async userPrivate(@Args('id', { type: () => Int }) id: number) {
		return this.usersService.findOne({ id }, false);
	}

	@Query(() => UserVisibilityObject)
	@Self('id')
	@Permissions('CAN_READ_USER_PRIVATE')
	@UseGuards(PermissionOrSelfGuard)
	async userVisibility(@Args('id', { type: () => Int }) id: number) {
		return this.usersService.findVisibility({ id });
	}

	@Query(() => [UserObject])
	@Self('id')
	@Permissions('CAN_READ_USER_PUBLIC')
	@UseGuards(PermissionOrSelfGuard)
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

	@Query(() => DateObject)
	@Self('id')
	@Permissions('CAN_UPDATE_USER')
	@UseGuards(PermissionOrSelfGuard)
	async lastPictureUpdate(@Args('id', { type: () => Int }) id: number) {
		const user = await this.usersService.findOne({ id }, false);

		if (!user || !user.picture) return new DateObject(new Date(0));
		await user.picture.init();

		return new DateObject(user.picture.updated);
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

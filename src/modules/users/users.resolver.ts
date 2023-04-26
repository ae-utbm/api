import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { UserObject } from './dto/user.object';
import { UsersService } from './users.service';

@Resolver(() => UserObject)
export class UsersResolver {
	constructor(private readonly usersService: UsersService) {}

	@Query(() => UserObject)
	user(
		@Args('id', { type: () => Int, nullable: true }) id?: number,
		@Args('email', { nullable: true }) email?: string,
	) {
		if (!id && !email) {
			throw new Error('Arguments must be one of ID or email.');
		}
		return this.usersService.findOne({ id, email });
	}
}

import { Field, Int, ObjectType } from '@nestjs/graphql';
import { User } from '../entities/user.entity';

@ObjectType('User')
export class UserObject implements Omit<User, 'password' | 'refreshTokens' | 'permissions' | 'roles'> {
	@Field(() => Int)
	readonly id: number;

	@Field()
	readonly firstName: string;

	@Field()
	readonly lastName: string;

	@Field()
	readonly email: string;

	@Field()
	readonly birthday: Date;

	@Field()
	readonly createdAt: Date;

	@Field()
	readonly updatedAt: Date;
}

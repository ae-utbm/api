import { Field, Int, ObjectType } from '@nestjs/graphql';
import { User } from '../entities/user.entity';

@ObjectType('User')
export class UserObject implements Omit<User, 'password' | 'refreshTokens' | 'permissions'> {
	@Field(() => Int)
	readonly id: number;

	@Field({ nullable: true })
	readonly firstName: string;

	@Field({ nullable: true })
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

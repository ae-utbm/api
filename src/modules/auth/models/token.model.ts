import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TokenObject {
	/** The access token, used to identify ourself */
	@Field()
	token: string;

	/** The user's id */
	@Field(() => Int)
	user_id: number;
}

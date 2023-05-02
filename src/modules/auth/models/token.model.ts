import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TokenObject {
	/** The access token, used to identify ourself */
	@Field()
	accessToken: string;

	/** The refresh token, used to get a new access token when it expires */
	@Field()
	refreshToken: string;
}

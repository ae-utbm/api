import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TokenObject {
	@Field()
	accessToken: string;

	@Field()
	refreshToken: string;
}

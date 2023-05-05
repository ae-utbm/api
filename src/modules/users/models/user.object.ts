import { BaseObject } from '@database/models/base.object';
import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class UserObject extends BaseObject {
	@Field()
	first_name: string;

	@Field()
	last_name: string;

	@Field({ nullable: true })
	email?: string;

	@Field({ nullable: true })
	birthday?: Date;

	@Field({ nullable: true })
	nickname?: string;

	@Field({ nullable: true })
	gender?: string;

	@Field({ nullable: true })
	cursus?: string;

	@Field(() => Int, { nullable: true })
	promotion?: number;

	@Field({ nullable: true })
	subscriber_account?: string;
}

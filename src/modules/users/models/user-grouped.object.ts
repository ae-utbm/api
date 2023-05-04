import { BaseObject } from '@database/models/base.object';
import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class UserGroupedObject extends BaseObject {
	@Field()
	first_name: string;

	@Field()
	last_name: string;

	@Field({ nullable: true })
	nickname?: string;

	@Field(() => Int, { nullable: true })
	promotion?: number;
}

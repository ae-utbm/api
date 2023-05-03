import { BaseObject } from '@database/models/base.object';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class UserGroupedObject extends BaseObject {
	@Field()
	first_name: string;

	@Field()
	last_name: string;

	@Field({ nullable: true })
	promotion?: number;
}

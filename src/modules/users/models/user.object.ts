import { BaseObject } from '@database/models/base.object';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class UserObject extends BaseObject {
	@Field()
	first_name: string;

	@Field()
	last_name: string;

	@Field()
	email: string;

	@Field()
	birthday: Date;

	@Field({ nullable: true })
	nickname?: string;

	@Field({ nullable: true })
	gender?: string;

	@Field({ nullable: true })
	cursus?: string;

	@Field({ nullable: true })
	promotion?: number;
}

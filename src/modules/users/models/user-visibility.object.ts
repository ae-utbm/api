import { BaseObject } from '@database/models/base.object';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class UserVisibilityObject extends BaseObject {
	@Field()
	email: boolean;

	@Field()
	birthday: boolean;

	@Field()
	gender: boolean;

	@Field()
	cursus: boolean;

	@Field()
	promotion: boolean;

	@Field()
	subscriber_account: boolean;

	@Field()
	specialty: boolean;

	@Field()
	pronouns: boolean;

	@Field()
	last_seen: boolean;

	@Field()
	subscription: boolean;

	@Field()
	secondary_email: boolean;

	@Field()
	phone: boolean;

	@Field()
	parent_contact: boolean;
}

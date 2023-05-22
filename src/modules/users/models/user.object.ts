import { BaseObject } from '@database/models/base.object';
import { PartialPromotionObject } from '@modules/promotions/models/promotion.object';
import { ObjectType, Field } from '@nestjs/graphql';

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

	@Field({ nullable: true })
	promotion?: PartialPromotionObject;

	@Field({ nullable: true })
	subscriber_account?: string;

	@Field({ nullable: true })
	specialty?: string;

	@Field({ nullable: true })
	pronouns?: string;

	@Field({ nullable: true })
	last_seen?: Date;

	@Field({ nullable: true })
	subscription?: Date;

	@Field({ nullable: true })
	secondary_email?: string;

	@Field({ nullable: true })
	phone?: string;

	@Field({ nullable: true })
	parent_contact?: string;
}

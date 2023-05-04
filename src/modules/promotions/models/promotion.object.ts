import { BaseObject } from '@database/models/base.object';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PromotionObject extends BaseObject {
	@Field()
	number: number;
}

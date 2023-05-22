import { BaseObject } from '@database/models/base.object';
import { Int, Field, ObjectType, PartialType } from '@nestjs/graphql';

@ObjectType()
export class PromotionObject extends BaseObject {
	@Field(() => Int)
	number: number;
}

@ObjectType()
export class PartialPromotionObject extends PartialType(PromotionObject) {}

import { BaseObject } from '@database/models/base.object';
import { Int, Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PromotionObject extends BaseObject {
	@Field(() => Int)
	number: number;
}

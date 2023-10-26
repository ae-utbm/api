import type { PromotionEntity } from '#types/api';

import { Cascade, Collection, Entity, OneToMany, OneToOne, Property } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';

import { BaseEntity } from '@modules/_mixin/entities/base.entity';
import { User } from '@modules/users/entities/user.entity';

import { PromotionPicture } from './promotion-picture.entity';

@Entity({ tableName: 'promotions' })
export class Promotion extends BaseEntity implements PromotionEntity<PromotionPicture, User> {
	@Property()
	@ApiProperty({ type: Number, minimum: 1 })
	number: number;

	@OneToMany(() => User, (user) => user.promotion, { cascade: [Cascade.REMOVE] })
	@ApiProperty({ type: Number })
	users: Collection<User>;

	@OneToOne(() => PromotionPicture, (picture) => picture.picture_promotion, { cascade: [Cascade.ALL], nullable: true })
	@ApiProperty({ type: PromotionPicture })
	picture?: PromotionPicture;
}

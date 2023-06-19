import type { PromotionEntity } from '@types';

import { Cascade, Collection, Entity, OneToMany, OneToOne, Property } from '@mikro-orm/core';
import { User } from '@modules/users/entities/user.entity';
import { BaseEntity } from '@modules/_mixin/entities/base.entity';
import { PromotionPicture } from './promotion-picture.entity';

@Entity({ tableName: 'promotions' })
export class Promotion extends BaseEntity implements PromotionEntity<PromotionPicture, User> {
	@Property()
	number: number;

	@OneToMany(() => User, (user) => user.promotion, { cascade: [Cascade.REMOVE] })
	users: Collection<User>;

	@OneToOne(() => PromotionPicture, (picture) => picture.promotion, { cascade: [Cascade.ALL], nullable: true })
	picture?: PromotionPicture;
}

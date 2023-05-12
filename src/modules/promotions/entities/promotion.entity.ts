import { BaseEntity } from '@database/entities/base.entity';
import { Cascade, Collection, Entity, OneToMany, OneToOne, Property } from '@mikro-orm/core';
import { User } from '@modules/users/entities/user.entity';
import { PromotionPicture } from './promotion-picture.entity';

@Entity({ tableName: 'promotions' })
export class Promotion extends BaseEntity {
	@Property()
	number: number;

	@OneToMany(() => User, (user) => user.promotion, { cascade: [Cascade.REMOVE] })
	users = new Collection<User>(this);

	@OneToOne(() => PromotionPicture, (picture) => picture.promotion, { cascade: [Cascade.ALL], nullable: true })
	picture?: PromotionPicture;
}

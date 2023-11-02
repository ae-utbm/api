import { Cascade, Collection, Entity, OneToMany, OneToOne, Property } from '@mikro-orm/core';

import { BaseEntity } from '@modules/_mixin/entities/base.entity';
import { User } from '@modules/users/entities/user.entity';

import { PromotionPicture } from './promotion-picture.entity';

@Entity({ tableName: 'promotions' })
export class Promotion extends BaseEntity implements Promotion {
	@Property()
	number: number;

	@OneToMany(() => User, (user) => user.promotion, {
		cascade: [Cascade.REMOVE],
		serializedName: 'users_count',
		serializer: (u: User[]) => u.length,
	})
	users: Collection<User>;

	@OneToOne(() => PromotionPicture, (picture) => picture.picture_promotion, {
		cascade: [Cascade.ALL],
		nullable: true,
		serializedName: 'picture_id',
		serializer: (p: PromotionPicture) => p?.id,
	})
	picture?: PromotionPicture;
}

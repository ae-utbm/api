import { Entity, OneToOne, Property } from '@mikro-orm/core';

import { File } from '@modules/files/entities/file.entity';

import { Promotion } from './promotion.entity';

@Entity()
export class PromotionPicture extends File<Promotion> {
	@OneToOne(() => Promotion, (promotion) => promotion.picture, { nullable: true, owner: true })
	picture_promotion: Promotion;

	@Property({ persist: false })
	get owner(): Promotion {
		return this.picture_promotion;
	}
}

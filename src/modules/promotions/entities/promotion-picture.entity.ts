import type { PromotionPictureEntity } from '@types';

import { Entity, OneToOne } from '@mikro-orm/core';
import { Promotion } from './promotion.entity';
import { FileEntity } from '@modules/_mixin/entities/file.entity';

@Entity({ tableName: 'promotions_pictures' })
export class PromotionPicture extends FileEntity implements PromotionPictureEntity<Promotion> {
	@OneToOne(() => Promotion, (promotion) => promotion.picture, { owner: true, unique: true })
	promotion: Promotion;
}

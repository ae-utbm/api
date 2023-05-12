import { FileEntity } from '@database/entities/file.entity';
import { Entity, OneToOne } from '@mikro-orm/core';
import { Promotion } from './promotion.entity';

@Entity({ tableName: 'promotions_pictures' })
export class PromotionPicture extends FileEntity {
	@OneToOne(() => Promotion, (promotion) => promotion.picture, { owner: true, unique: true })
	promotion: Promotion;
}

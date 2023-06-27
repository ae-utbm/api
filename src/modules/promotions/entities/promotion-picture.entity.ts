import type { PromotionPictureEntity } from '@types';

import { Entity, OneToOne } from '@mikro-orm/core';
import { Promotion } from './promotion.entity';
import { FileEntity } from '@modules/_mixin/entities/file.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ tableName: 'promotions_pictures' })
export class PromotionPicture extends FileEntity implements PromotionPictureEntity<Promotion> {
	@ApiProperty({ type: () => Number })
	@OneToOne(() => Promotion, (promotion) => promotion.picture, { owner: true, unique: true })
	promotion: Promotion;
}

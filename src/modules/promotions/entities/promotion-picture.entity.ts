import type { PromotionPictureEntity } from '@types';

import { Entity, OneToOne } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';

import { FileEntity } from '@modules/_mixin/entities/file.entity';

import { Promotion } from './promotion.entity';

@Entity({ tableName: 'promotions_pictures' })
export class PromotionPicture extends FileEntity implements PromotionPictureEntity<Promotion> {
	@ApiProperty({ type: () => Number, minimum: 1 })
	@OneToOne(() => Promotion, (promotion) => promotion.picture, { owner: true, unique: true })
	promotion: Promotion;
}

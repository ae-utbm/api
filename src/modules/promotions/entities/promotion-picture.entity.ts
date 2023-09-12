import type { PromotionPictureEntity } from '#types/api';

import { Entity, OneToOne } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';

import { File } from '@modules/files/entities/file.entity';

import { Promotion } from './promotion.entity';

@Entity()
export class PromotionPicture extends File implements PromotionPictureEntity<Promotion> {
	@ApiProperty({ type: Number, minimum: 1 })
	@OneToOne(() => Promotion, (promotion) => promotion.picture, { nullable: true, owner: true })
	picture_promotion: Promotion;
}

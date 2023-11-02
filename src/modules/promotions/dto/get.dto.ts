import type { IPromotionPictureResponseDTO, IPromotionResponseDTO } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

import { BaseResponseDTO } from '@modules/_mixin/dto/base.dto';
import { FileGetDTO } from '@modules/files/dto/get.dto';

export class PromotionResponseDTO extends BaseResponseDTO implements IPromotionResponseDTO {
	@ApiProperty()
	@IsInt()
	number: number;

	@ApiProperty()
	@IsInt()
	users_count: number;

	@ApiProperty({ required: false })
	@IsInt()
	picture?: number;
}

export class PromotionPictureResponseDTO extends FileGetDTO implements IPromotionPictureResponseDTO {
	@ApiProperty()
	@IsInt()
	picture_promotion_id: number;
}

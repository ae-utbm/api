import type { PromotionResponseDto } from '@types';

import { BaseResponseDTO } from '@modules/_mixin/dto/base-response.dto';
import { ApiProperty } from '@nestjs/swagger';
import { PromotionPicture } from '../entities/promotion-picture.entity';

export class PromotionResponseDTO extends BaseResponseDTO implements PromotionResponseDto {
	@ApiProperty()
	number: number;

	@ApiProperty()
	users: number;

	@ApiProperty({ required: false })
	picture?: PromotionPicture;
}

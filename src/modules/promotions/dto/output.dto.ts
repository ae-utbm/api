import type { OutputPromotionPictureDto, OutputPromotionDto } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';

import { OutputBaseDTO } from '@modules/base/dto/output.dto';
import { OutputFileDTO } from '@modules/files/dto/output.dto';

export class OutputPromotionDTO extends OutputBaseDTO implements OutputPromotionDto {
	@ApiProperty()
	number: number;

	@ApiProperty()
	users_count: number;

	@ApiProperty({ required: false })
	picture?: number;
}

export class OutputPromotionPictureDTO extends OutputFileDTO implements OutputPromotionPictureDto {
	@ApiProperty()
	picture_promotion_id: number;
}

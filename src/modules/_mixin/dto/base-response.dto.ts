import { ApiProperty } from '@nestjs/swagger';

import { BaseResponseDto } from '#types/api';

export class BaseResponseDTO implements BaseResponseDto {
	@ApiProperty({ minimum: 1 })
	id: number;

	@ApiProperty()
	updated: Date;

	@ApiProperty()
	created: Date;
}

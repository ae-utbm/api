import type { IBaseResponseDTO } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsInt } from 'class-validator';

/**
 * Base response DTO class
 */
export abstract class BaseResponseDTO implements IBaseResponseDTO {
	@ApiProperty({ minimum: 1 })
	@IsInt()
	id: number;

	@ApiProperty()
	@IsDate()
	updated: Date;

	@ApiProperty()
	@IsDate()
	created: Date;
}

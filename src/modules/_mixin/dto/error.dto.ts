import type { IErrorResponseDTO } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt } from 'class-validator';

export class ErrorResponseDTO implements IErrorResponseDTO {
	@ApiProperty({ example: 'Bad Request' })
	@IsString()
	error: string;

	@ApiProperty({ required: false })
	@IsString()
	message: string;

	@ApiProperty({ example: 400 })
	@IsInt()
	statusCode: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '@types';

export class BaseResponseDTO implements BaseResponseDto {
	@ApiProperty({ minimum: 1 })
	id: number;

	@ApiProperty()
	updated_at: Date;

	@ApiProperty()
	created_at: Date;
}

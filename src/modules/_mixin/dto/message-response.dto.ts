import { ApiProperty } from '@nestjs/swagger';
import type { MessageResponseDto } from '@types';
import { IsString } from 'class-validator';

export class MessageResponseDTO implements MessageResponseDto {
	@ApiProperty()
	@IsString()
	message: string;
}

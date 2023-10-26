import type { MessageResponseDto } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

/**
 * Message response DTO class (used to send a message to the client)
 * -> Mainly used for DELETE requests // TODO: Is a text message is really needed for DELETE requests?
 *
 * @example { message: 'User successfully deleted', status_code: 200 }
 */
export class MessageResponseDTO implements MessageResponseDto {
	@ApiProperty()
	@IsString()
	message: string;

	@ApiProperty({ example: 200 })
	@IsNumber()
	status_code: number;
}

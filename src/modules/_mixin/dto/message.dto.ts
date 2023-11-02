import type { IMessageResponseDTO } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

/**
 * Message response DTO class (used to send a message to the client)
 * -> Mainly used for DELETE requests
 *
 * @example { message: 'User successfully deleted', statusCode: 200 }
 */
export class MessageResponseDTO implements IMessageResponseDTO {
	@ApiProperty()
	@IsString()
	message: string;

	@ApiProperty({ example: 200 })
	@IsInt()
	statusCode: number;
}

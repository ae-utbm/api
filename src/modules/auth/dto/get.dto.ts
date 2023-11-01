import type { ITokenDTO } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class TokenDTO implements ITokenDTO {
	@ApiProperty({ example: 'xxxxx.yyyyy.zzzzz' })
	@IsString()
	token: string;

	@ApiProperty({ minimum: 1 })
	@IsInt()
	user_id: number;
}

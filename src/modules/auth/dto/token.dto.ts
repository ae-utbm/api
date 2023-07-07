import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

import type { UserTokenDto } from 'src/types';

export class TokenDTO implements UserTokenDto {
	@ApiProperty()
	@IsString()
	token: string;

	@ApiProperty({ minimum: 1 })
	@IsInt()
	user_id: number;
}

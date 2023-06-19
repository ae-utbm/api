import type { UserTokenDto } from 'src/types';

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class TokenDTO implements UserTokenDto {
	@ApiProperty()
	@IsString()
	token: string;

	@ApiProperty()
	@IsInt()
	user_id: number;
}

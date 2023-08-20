import type { UserSignInDto, email } from '@types';

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UserSignInDTO implements UserSignInDto {
	@ApiProperty({ type: String })
	@IsString()
	email: email;

	@ApiProperty({ example: 'password' })
	@IsString()
	password: string;
}

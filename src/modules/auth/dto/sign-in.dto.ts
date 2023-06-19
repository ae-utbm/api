import type { UserSignInDto } from '@types';

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UserSignInDTO implements UserSignInDto {
	@ApiProperty()
	@IsString()
	email: string;

	@ApiProperty()
	@IsString()
	password: string;
}

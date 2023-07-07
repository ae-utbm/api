import type { UserSignInDto, Email } from '@types';

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UserSignInDTO implements UserSignInDto {
	@ApiProperty({ type: String })
	@IsString()
	email: Email;

	@ApiProperty()
	@IsString()
	password: string;
}

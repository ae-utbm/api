import type { email } from '#types';
import type { ICreateUserDTO, ICreateUserByAdminDTO, ISignInDTO } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class CreateUserDTO implements ICreateUserDTO {
	@ApiProperty({ example: 'example@domain.com' })
	@IsEmail()
	email: email;

	@ApiProperty({ example: new Date('2001-01-01').toISOString() })
	@IsDate()
	birth_date: Date;

	@ApiProperty({ example: 'John' })
	@IsString()
	first_name: string;

	@ApiProperty({ example: 'Doe' })
	@IsString()
	last_name: string;
}

export class UserPostDTO extends CreateUserDTO implements ICreateUserByAdminDTO {
	@ApiProperty({ example: 'password' })
	@IsStrongPassword()
	password: string;
}

export class SignInDTO implements ISignInDTO {
	@ApiProperty({ type: String })
	@IsString()
	email: email;

	@ApiProperty({ example: 'password' })
	@IsString()
	password: string;
}

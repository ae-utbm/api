import type { UserPostDto, email } from '@types';

import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class UserPostByAdminDTO implements Omit<UserPostDto, 'password'> {
	@ApiProperty()
	@IsEmail()
	email: email;

	@ApiProperty()
	@IsDate()
	birthday: Date;

	@ApiProperty()
	@IsString()
	first_name: string;

	@ApiProperty()
	@IsString()
	last_name: string;
}

export class UserPostDTO extends UserPostByAdminDTO implements UserPostDto {
	@ApiProperty()
	@IsStrongPassword()
	password: string;
}

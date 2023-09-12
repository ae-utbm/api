import type { email } from '#types';
import type { UserPostDto } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class UserPostByAdminDTO implements Omit<UserPostDto, 'password'> {
	@ApiProperty({ example: 'example@domain.com' })
	@IsEmail()
	email: email;

	@ApiProperty({ example: '1999-12-31' })
	@IsDate()
	birth_date: Date;

	@ApiProperty({ example: 'John' })
	@IsString()
	first_name: string;

	@ApiProperty({ example: 'Doe' })
	@IsString()
	last_name: string;
}

export class UserPostDTO extends UserPostByAdminDTO implements UserPostDto {
	@ApiProperty({ example: 'password' })
	@IsStrongPassword()
	password: string;
}

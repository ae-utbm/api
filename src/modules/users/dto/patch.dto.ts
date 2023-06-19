import type { UserPatchDto, email } from '@types';

import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEmail, IsNumber, IsString } from 'class-validator';

export class UserPatchDTO implements UserPatchDto {
	@ApiProperty({ required: true })
	@IsNumber()
	id: number;

	@ApiProperty()
	@IsString()
	nickname?: string;

	@ApiProperty()
	@IsString()
	gender?: string;

	@ApiProperty()
	@IsString()
	cursus?: string;

	@ApiProperty()
	@IsNumber()
	promotion?: number;

	@ApiProperty()
	@IsEmail()
	email: email;

	@ApiProperty()
	@IsString()
	password: string;

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

import type { email } from '#types';
import type { UserPatchDto } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEmail, IsNumber, IsString } from 'class-validator';

export class UserPatchDTO implements UserPatchDto {
	@ApiProperty({ required: true })
	@IsNumber()
	id: number;

	@ApiProperty()
	@IsEmail()
	email: email;

	@ApiProperty()
	@IsString()
	password: string;

	@ApiProperty()
	@IsDate()
	birth_date: Date;

	@ApiProperty()
	@IsString()
	first_name: string;

	@ApiProperty()
	@IsString()
	last_name: string;

	@ApiProperty()
	@IsString()
	nickname?: string;

	@ApiProperty()
	@IsString()
	gender?: string;

	@ApiProperty()
	@IsString()
	pronouns?: string;

	@ApiProperty()
	@IsString()
	secondary_email?: string;

	@ApiProperty()
	@IsString()
	phone?: string;

	@ApiProperty()
	@IsString()
	parent_contact?: string;

	// TODO: to implement in an upcoming PR (see the user entity)
	// @ApiProperty()
	// @IsString()
	// cursus?: string;

	// @ApiProperty()
	// @IsString()
	// specialty?: string;

	@ApiProperty()
	@IsNumber()
	promotion?: number;
}

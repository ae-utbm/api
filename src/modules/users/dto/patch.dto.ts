import type { email } from '#types';
import type { UserPatchDto } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEmail, IsNumber, IsString } from 'class-validator';

export class UserPatchDTO implements UserPatchDto {
	@ApiProperty({ required: true, minimum: 1 })
	@IsNumber()
	id: number;

	@ApiProperty({ required: false })
	@IsEmail()
	email?: email;

	@ApiProperty({ required: false })
	@IsString()
	password?: string;

	@ApiProperty({ required: false })
	@IsDate()
	birth_date?: Date;

	@ApiProperty({ required: false })
	@IsString()
	first_name?: string;

	@ApiProperty({ required: false })
	@IsString()
	last_name?: string;

	@ApiProperty({ required: false })
	@IsString()
	nickname?: string;

	@ApiProperty({ required: false })
	@IsString()
	gender?: string;

	@ApiProperty({ required: false })
	@IsString()
	pronouns?: string;

	@ApiProperty({ required: false })
	@IsString()
	secondary_email?: string;

	@ApiProperty({ required: false })
	@IsString()
	phone?: string;

	@ApiProperty({ required: false })
	@IsString()
	parent_contact?: string;

	// TODO: to implement in an upcoming PR (see the user entity)
	// @ApiProperty({ required: false })
	// @IsString()
	// cursus?: string;

	// @ApiProperty({ required: false })
	// @IsString()
	// specialty?: string;

	@ApiProperty({ required: false, minimum: 1 })
	@IsNumber()
	promotion?: number;
}

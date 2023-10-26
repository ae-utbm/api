import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsNumber, IsString } from 'class-validator';

import { PERMISSION_NAMES, type UserRolesGetDto } from '#types/api';
import { PERMISSIONS_NAMES } from '@exported/api/constants/perms';

export class UserRolesGetDTO implements UserRolesGetDto {
	@ApiProperty({ required: true, minimum: 1 })
	@IsNumber()
	id: number;

	@ApiProperty({ required: true, type: Date })
	@IsDate()
	created: Date;

	@ApiProperty({ required: true, type: Date })
	@IsDate()
	updated: Date;

	@ApiProperty({ required: true, type: Date })
	@IsDate()
	expires: Date;

	@ApiProperty({ required: true, example: 'AE_ADMINS' })
	@IsString()
	name: Uppercase<string>;

	@ApiProperty({ required: true, type: Boolean, default: false })
	@IsBoolean()
	revoked: boolean;

	@ApiProperty({ enum: PERMISSIONS_NAMES, isArray: true })
	@IsString()
	permissions: Array<PERMISSION_NAMES>;
}

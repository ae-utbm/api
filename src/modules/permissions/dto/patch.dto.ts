import type { PermissionName, PermissionPatchDto } from '@types';

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsDate, IsBoolean } from 'class-validator';

import { PERMISSIONS_NAMES } from 'src/types/api/permissions/perms';

export class PermissionPatchDTO implements PermissionPatchDto {
	@ApiProperty({ required: true, minimum: 1 })
	@IsInt()
	id: number;

	@ApiProperty({ required: true, minimum: 1 })
	@IsInt()
	user_id: number;

	@ApiProperty({ enum: PERMISSIONS_NAMES })
	@IsString()
	name: PermissionName;

	@ApiProperty()
	@IsDate()
	expires: Date;

	@ApiProperty()
	@IsBoolean()
	revoked: boolean;
}

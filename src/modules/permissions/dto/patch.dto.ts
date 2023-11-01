import type { PERMISSION_NAMES, IPermissionPatchDTO } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsDate, IsBoolean } from 'class-validator';

import { PERMISSIONS_NAMES } from '@exported/api/constants/perms';

export class PermissionPatchDTO implements IPermissionPatchDTO {
	@ApiProperty({ required: true, minimum: 1 })
	@IsInt()
	id: number;

	@ApiProperty({ required: true, minimum: 1 })
	@IsInt()
	user_id: number;

	@ApiProperty({ enum: PERMISSIONS_NAMES })
	@IsString()
	name: PERMISSION_NAMES;

	@ApiProperty()
	@IsDate()
	expires: Date;

	@ApiProperty()
	@IsBoolean()
	revoked: boolean;
}

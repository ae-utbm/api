import type { PERMISSION_NAMES, PermissionPostDto } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsInt, IsString } from 'class-validator';

import { PERMISSIONS_NAMES } from '@exported/api/constants/perms';

export class PermissionPostDTO implements PermissionPostDto {
	@ApiProperty()
	@IsInt()
	id: number;

	@ApiProperty({ enum: PERMISSIONS_NAMES })
	@IsString()
	permission: PERMISSION_NAMES;

	@ApiProperty()
	@IsDate()
	expires: Date;
}

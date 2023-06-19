import type { PermissionName, PermissionsPostDto } from '@types';

import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNumber, IsString } from 'class-validator';
import { PERMISSIONS_NAMES } from 'src/types/api/permissions/perms';

export class PermissionPostDTO implements PermissionsPostDto {
	@ApiProperty()
	@IsNumber()
	id: number;

	@ApiProperty({ enum: PERMISSIONS_NAMES })
	@IsString()
	permission: PermissionName;

	@ApiProperty()
	@IsDate()
	expires: Date;
}

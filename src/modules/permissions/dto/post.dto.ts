import type { PERMISSION_NAMES, PermissionsPostDto } from '@types';

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDate, IsInt, IsString } from 'class-validator';

import { PERMISSIONS_NAMES } from 'src/types/api/permissions/perms';

export class PermissionPostDTO implements PermissionsPostDto {
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

export class RolePermissionsDto implements RolePermissionsDto {
	@ApiProperty()
	@IsInt()
	id: number;

	@ApiProperty({ enum: PERMISSIONS_NAMES, isArray: true })
	@IsArray()
	permissions: PERMISSION_NAMES[];
}

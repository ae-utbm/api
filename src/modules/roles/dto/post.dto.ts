import type { RolePostDto, PermissionName } from '@types';

import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsString } from 'class-validator';
import { PERMISSIONS_NAMES } from 'src/types/api/permissions/perms';

export class RolePostDTO implements RolePostDto {
	@ApiProperty({ type: String, example: 'AE_ADMINS' })
	@IsString()
	name: Uppercase<string>;

	@ApiProperty({ enum: PERMISSIONS_NAMES, isArray: true })
	@IsString()
	permissions: PermissionName[];

	@ApiProperty()
	@IsDate()
	expires: Date;
}

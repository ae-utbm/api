import type { IRolePostDTO, PERMISSION_NAMES } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { PERMISSIONS_NAMES } from '@exported/api/constants/perms';

export class RolePostDTO implements IRolePostDTO {
	@ApiProperty({ type: String, example: 'AE_ADMINS' })
	@IsString()
	name: Uppercase<string>;

	@ApiProperty({ enum: PERMISSIONS_NAMES, isArray: true })
	@IsString()
	permissions: PERMISSION_NAMES[];
}

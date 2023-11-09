import type { OutputPermissionDto, OutputPermissionsOfRoleDto, PERMISSION_NAMES } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';

import { PERMISSIONS_NAMES } from '@exported/api/constants/perms';
import { OutputBaseDTO } from '@modules/base/dto/output.dto';

export class OutputPermissionsOfRoleDTO implements OutputPermissionsOfRoleDto {
	@ApiProperty()
	id: number;

	@ApiProperty({ enum: PERMISSIONS_NAMES, isArray: true })
	permissions: PERMISSION_NAMES[];
}

export class OutputPermissionDTO extends OutputBaseDTO implements OutputPermissionDto {
	@ApiProperty({ enum: PERMISSIONS_NAMES })
	name: PERMISSION_NAMES;

	@ApiProperty()
	user_id: number;

	@ApiProperty()
	revoked: boolean;

	@ApiProperty()
	expires: Date;
}

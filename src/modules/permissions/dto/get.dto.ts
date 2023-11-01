import type { IPermissionGetDTO, IPermissionsOfRoleDTO, PERMISSION_NAMES } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsArray, IsDate, IsBoolean } from 'class-validator';

import { PERMISSIONS_NAMES } from '@exported/api/constants/perms';
import { BaseResponseDTO } from '@modules/_mixin/dto/base.dto';

export class PermissionsOfRoleDTO implements IPermissionsOfRoleDTO {
	@ApiProperty()
	@IsInt()
	id: number;

	@ApiProperty({ enum: PERMISSIONS_NAMES, isArray: true })
	@IsArray()
	permissions: PERMISSION_NAMES[];
}

export class PermissionGetDTO extends BaseResponseDTO implements IPermissionGetDTO {
	@ApiProperty({ enum: PERMISSIONS_NAMES })
	@IsArray()
	name: PERMISSION_NAMES;

	@ApiProperty()
	@IsInt()
	user: number;

	@ApiProperty()
	@IsBoolean()
	revoked: boolean;

	@ApiProperty()
	@IsDate()
	expires: Date;
}

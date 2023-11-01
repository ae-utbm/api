import type { IRoleGetDTO, IRoleUsersResponseDTO, PERMISSION_NAMES } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDate, IsInt, IsString } from 'class-validator';

import { PERMISSIONS_NAMES } from '@exported/api/constants/perms';
import { BaseUserResponseDTO } from '@modules/users/dto/base-user.dto';

export class RoleUsersResponseDTO extends BaseUserResponseDTO implements IRoleUsersResponseDTO {
	@ApiProperty({ type: Date })
	@IsDate()
	role_expires: Date;
}

export class RoleGetDTO implements IRoleGetDTO {
	@ApiProperty({ type: String, example: 'AE_ADMIN' })
	@IsString() // TODO: Add custom validator to check if it's uppercase
	name: Uppercase<string>;

	@ApiProperty({ type: Boolean, default: false })
	@IsBoolean()
	revoked: boolean;

	@ApiProperty({ enum: PERMISSIONS_NAMES, isArray: true })
	@IsArray() // TODO: Add custom validator to check if it's array of uppercase strings
	permissions: PERMISSION_NAMES[];

	@ApiProperty({ type: Number, default: 1 })
	@IsInt()
	users: number;
}

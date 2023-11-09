import type { OutputRoleDto, OutputRoleUserDto, PERMISSION_NAMES } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';

import { PERMISSIONS_NAMES } from '@exported/api/constants/perms';
import { OutputBaseUserDTO } from '@modules/users/dto/output.dto';

export class OutputRoleUserDTO extends OutputBaseUserDTO implements OutputRoleUserDto {
	@ApiProperty({ type: Date })
	role_expires: Date;
}

export class OutputRoleDTO implements OutputRoleDto {
	@ApiProperty({ type: String, example: 'AE_ADMIN' })
	name: Uppercase<string>;

	@ApiProperty({ type: Boolean, default: false })
	revoked: boolean;

	@ApiProperty({ enum: PERMISSIONS_NAMES, isArray: true })
	permissions: PERMISSION_NAMES[];

	@ApiProperty({ type: Number, default: 1 })
	users_count: number;
}

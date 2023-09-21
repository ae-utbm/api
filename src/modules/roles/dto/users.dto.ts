import type { RoleUsersResponseDto } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';

import { BaseUserResponseDTO } from '@modules/users/dto/base-user.dto';

export class RoleUsersResponseDTO extends BaseUserResponseDTO implements RoleUsersResponseDto {
	@ApiProperty({ type: Date })
	role_expires: Date;
}

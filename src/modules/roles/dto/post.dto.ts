import type { RolePostDto, PermissionName } from '@types';

import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsString } from 'class-validator';

export class RolePostDTO implements RolePostDto {
	@ApiProperty()
	@IsString()
	name: Uppercase<string>;

	@ApiProperty()
	@IsString()
	permissions: PermissionName[];

	@ApiProperty()
	@IsDate()
	expires: Date;
}

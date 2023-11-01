import type { IRolePatchDTO, IRoleEditUserDTO } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsInt } from 'class-validator';

import { RolePostDTO } from './post.dto';

export class RolePatchDTO extends RolePostDTO implements IRolePatchDTO {
	@ApiProperty({ required: true, minimum: 1 })
	@IsInt()
	id: number;
}

export class RoleEditUserDTO implements IRoleEditUserDTO {
	@ApiProperty({ required: true, type: Number, minimum: 1 })
	@IsInt()
	id: number;

	@ApiProperty({ required: true, type: Date })
	@IsDate()
	expires: Date;
}

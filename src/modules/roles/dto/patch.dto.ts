import type { RolePatchDto, RoleEditUserDto } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNumber } from 'class-validator';

import { RolePostDTO } from './post.dto';

export class RolePatchDTO extends RolePostDTO implements RolePatchDto {
	@ApiProperty({ required: true, minimum: 1 })
	@IsNumber()
	id: number;
}

export class RoleEditUserDTO implements RoleEditUserDto {
	@ApiProperty({ required: true, type: Number, minimum: 1 })
	@IsNumber()
	id: number;

	@ApiProperty({ required: true, type: Date })
	@IsDate()
	expires: Date;
}

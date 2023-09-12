import type { RolePatchDto } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

import { RolePostDTO } from './post.dto';

export class RolePatchDTO extends RolePostDTO implements RolePatchDto {
	@ApiProperty({ required: true, minimum: 1 })
	@IsNumber()
	id: number;
}

export class RoleEditUsersDTO {
	@ApiProperty({ required: true, type: [Number], example: [1, 2, 3] })
	@IsNumber({}, { each: true })
	users: number[];
}

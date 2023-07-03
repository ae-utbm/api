import type { RolePatchDto } from '@types';

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { RolePostDTO } from './post.dto';

export class RolePatchDTO extends RolePostDTO implements RolePatchDto {
	@ApiProperty({ required: true, minimum: 1 })
	@IsNumber()
	id: number;
}

import type { IBaseUserDTO } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';

import { BaseResponseDTO } from '@modules/_mixin/dto/base.dto';

export class BaseUserResponseDTO extends BaseResponseDTO implements IBaseUserDTO {
	@ApiProperty()
	first_name: string;

	@ApiProperty()
	last_name: string;

	@ApiProperty({ required: false })
	nickname?: string;
}

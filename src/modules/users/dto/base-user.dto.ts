import { ApiProperty } from '@nestjs/swagger';

import { BaseResponseDTO } from '@modules/_mixin/dto/base-response.dto';
import { User } from '@modules/users/entities/user.entity';

export class BaseUserResponseDTO
	extends BaseResponseDTO
	implements Pick<User, 'first_name' | 'last_name' | 'nickname'>
{
	@ApiProperty()
	first_name: string;

	@ApiProperty()
	last_name: string;

	@ApiProperty()
	nickname?: string;
}

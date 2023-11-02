import type { ILogDTO } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class LogDTO implements ILogDTO {
	@ApiProperty()
	@IsInt()
	user_id: number;

	@ApiProperty()
	@IsString()
	action: string;

	@ApiProperty()
	@IsString()
	ip: string;

	@ApiProperty()
	@IsString()
	user_agent: string;

	@ApiProperty()
	@IsString()
	route: string;

	@ApiProperty()
	@IsString()
	method: string;

	@ApiProperty()
	@IsString()
	body: string;

	@ApiProperty()
	@IsString()
	query: string;

	@ApiProperty()
	@IsString()
	params: string;

	@ApiProperty({ required: false })
	@IsString()
	response?: string;

	@ApiProperty({ required: false })
	@IsInt()
	status_code?: number;

	@ApiProperty({ required: false })
	@IsString()
	error?: string;

	@ApiProperty({ required: false })
	@IsString()
	error_stack?: string;

	@ApiProperty({ required: false })
	@IsString()
	error_message?: string;
}

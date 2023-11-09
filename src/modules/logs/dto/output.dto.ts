import type { OutputLogDto } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';

export class OutputLogDTO implements OutputLogDto {
	@ApiProperty()
	user_id: number;

	@ApiProperty()
	action: string;

	@ApiProperty()
	ip: string;

	@ApiProperty()
	user_agent: string;

	@ApiProperty()
	route: string;

	@ApiProperty()
	method: string;

	@ApiProperty()
	body: string;

	@ApiProperty()
	query: string;

	@ApiProperty()
	params: string;

	@ApiProperty({ required: false })
	response?: string;

	@ApiProperty({ required: false })
	status_code?: number;

	@ApiProperty({ required: false })
	error?: string;

	@ApiProperty({ required: false })
	error_stack?: string;

	@ApiProperty({ required: false })
	error_message?: string;
}

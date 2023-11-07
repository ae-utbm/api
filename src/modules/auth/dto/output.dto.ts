import type { OutputTokenDto } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';

export class OutputTokenDTO implements OutputTokenDto {
	@ApiProperty({ example: 'xxxxx.yyyyy.zzzzz' })
	token: string;

	@ApiProperty({ minimum: 1 })
	user_id: number;
}

import { ApiProperty } from '@nestjs/swagger';

import { I18nIsId } from '@modules/base/decorators';

export class InputIdParamDTO {
	@ApiProperty({ minimum: 1 })
	@I18nIsId()
	id: number;
}

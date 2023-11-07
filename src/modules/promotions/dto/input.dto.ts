import { ApiProperty } from '@nestjs/swagger';

import { I18nIsId } from '@modules/_mixin/decorators';

export class InputPromotionNumberParamDTO {
	@ApiProperty({ minimum: 1 })
	@I18nIsId()
	number: number;
}

import type { I18nTranslations } from '#types/api';

import { applyDecorators } from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export const I18nIsBoolean = () => {
	return applyDecorators(
		IsBoolean({
			message: i18nValidationMessage<I18nTranslations>('validations.boolean.invalid.format'),
		}),
	);
};

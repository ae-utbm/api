import type { I18nTranslations } from '#types/api';

import { applyDecorators } from '@nestjs/common';
import { IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export const I18nIsString = () => {
	return applyDecorators(
		IsString({
			message: i18nValidationMessage<I18nTranslations>('validations.string.invalid.format'),
		}),
	);
};

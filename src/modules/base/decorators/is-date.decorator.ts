import type { I18nTranslations } from '#types/api';

import { applyDecorators } from '@nestjs/common';
import { IsDateString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export const I18nIsDate = () => {
	return applyDecorators(
		IsDateString(
			{},
			{
				message: i18nValidationMessage<I18nTranslations>('validations.date.invalid.format'),
			},
		),
	);
};

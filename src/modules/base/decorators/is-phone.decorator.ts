import type { I18nTranslations } from '#types/api';

import { applyDecorators } from '@nestjs/common';
import { IsPhoneNumber } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export const I18nIsPhoneNumber = () => {
	return applyDecorators(
		IsPhoneNumber(undefined, {
			message: i18nValidationMessage<I18nTranslations>('validations.phone.invalid.format'),
		}),
	);
};

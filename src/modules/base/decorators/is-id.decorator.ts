import type { I18nTranslations } from '#types/api';

import { applyDecorators } from '@nestjs/common';
import { ValidationOptions, isNumber, isNumberString, registerDecorator } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export const I18nIsId = (validationOptions?: ValidationOptions) => {
	return applyDecorators(
		IsNumberStringOrNumber({
			message: i18nValidationMessage<I18nTranslations>('validations.id.invalid.format'),
			...validationOptions,
		}),
	);
};

/**
 * Validate if the value is a number or a number string.
 *
 * @example value = 1 => true
 * @example value = '1' => true
 * @example value = 'invalid' => false
 */
export const IsNumberStringOrNumber = (validationOptions?: ValidationOptions): PropertyDecorator => {
	return function (object: object, propertyName: string | symbol) {
		registerDecorator({
			name: 'isNumberStringOrNumber',
			target: object.constructor,
			propertyName: propertyName as string,
			constraints: [],
			options: validationOptions,
			validator: {
				validate(value: unknown) {
					if (typeof value !== 'string' && typeof value !== 'number') return false;

					if (typeof value === 'string') return isNumberString(value, { no_symbols: true });
					return isNumber(value);
				},
			},
		});
	};
};

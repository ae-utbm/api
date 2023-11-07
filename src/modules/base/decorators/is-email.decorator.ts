import type { email } from '#types';
import type { I18nTranslations } from '#types/api';

import { applyDecorators } from '@nestjs/common';
import { IsEmail, ValidationOptions, registerDecorator } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { EmailsService } from '@modules/emails/emails.service';

/**
 * Custom class validator to check if the email can be used or not.
 * (following AE's rules)
 *
 * @remark we use our own custom blacklist because we want to be able to blacklist hosts, emails but
 * also whitelist some of them.
 */
function IsEmailAuthorized(validationOptions?: ValidationOptions): PropertyDecorator {
	return function (object: object, propertyName: string | symbol) {
		registerDecorator({
			name: 'isEmail',
			target: object.constructor,
			propertyName: propertyName as string,
			constraints: [],
			options: validationOptions,
			validator: {
				validate(value: unknown) {
					return typeof value === 'string' && !EmailsService.isEmailBlacklisted(value as email);
				},
			},
		});
	};
}

/**
 * Check if the email is valid and not blacklisted, using the blacklisted defined in the env.
 */
export const I18nIsEmail = () => {
	return applyDecorators(
		IsEmailAuthorized({ message: i18nValidationMessage<I18nTranslations>('validations.email.invalid.blacklisted') }),
		IsEmail({}, { message: i18nValidationMessage<I18nTranslations>('validations.email.invalid.format') }),
	);
};

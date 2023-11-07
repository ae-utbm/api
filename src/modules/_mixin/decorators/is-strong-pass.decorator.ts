import type { I18nTranslations } from '#types/api';

import { applyDecorators } from '@nestjs/common';
import { ValidationOptions, registerDecorator } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { env } from '@env';
import { randomInt } from '@exported/global/utils';

const SYMBOL_CHARS = '!@#$%^&*()';
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';

export const MINIMUM_PASSWORD_LENGTH = 8;
export const MINIMUM_SYMBOLS = 1;
export const MINIMUM_LOWERCASE = 1;
export const MINIMUM_UPPERCASE = 1;
export const MINIMUM_NUMBERS = 1;

/**
 * Generates a random password of the given length.
 * @param {number} length the length of the password to generate
 * @returns {string} the generated password
 *
 * TODO move that file to somewhere else?
 */
export function generateRandomPassword(length: number = MINIMUM_PASSWORD_LENGTH): string {
	if (length < MINIMUM_PASSWORD_LENGTH) length = MINIMUM_PASSWORD_LENGTH;

	const password = [
		SYMBOL_CHARS[randomInt(SYMBOL_CHARS.length - 1)],
		LOWERCASE_CHARS[randomInt(LOWERCASE_CHARS.length - 1)],
		UPPERCASE_CHARS[randomInt(UPPERCASE_CHARS.length - 1)],
		NUMBERS[randomInt(NUMBERS.length - 1)],
	].shuffle();

	const remainingLength = length - password.length;

	for (let i = 0; i < remainingLength; i++) {
		const charSet = SYMBOL_CHARS + LOWERCASE_CHARS + UPPERCASE_CHARS + NUMBERS;
		password.push(charSet[randomInt(charSet.length - 1)]);
	}

	return password.join('');
}

/**
 * Check if the password is strong enough
 * @param {string} password the password to check
 * @returns {boolean} true if the password is strong enough, false otherwise
 */
export function isStrongPassword(password: string): boolean {
	if (env.DEBUG && password === 'root') return true; // Allow 'root' password in DEBUG mode (tests & dev)

	const regex = new RegExp(
		`^(?=.*[${LOWERCASE_CHARS}])(?=.*[${UPPERCASE_CHARS}])(?=.*[${NUMBERS}])(?=.*[${SYMBOL_CHARS}]).{${MINIMUM_PASSWORD_LENGTH},}$`,
	);
	return regex.test(password);
}

/**
 * Custom class validator to check if the password is strong enough
 * @remark If env.DEBUG is true, allow 'root' password (for tests & dev)
 */
export function IsStrongPassword(validationOptions?: ValidationOptions): PropertyDecorator {
	return function (object: object, propertyName: string | symbol) {
		registerDecorator({
			name: 'isStrongPassword',
			target: object.constructor,
			propertyName: propertyName as string,
			constraints: [],
			options: validationOptions,
			validator: {
				validate(value: unknown) {
					return typeof value === 'string' && isStrongPassword(value);
				},
			},
		});
	};
}

/**
 * Validate the password strength
 * @remark If env.DEBUG is true, allow 'root' password (for tests & dev)
 */
export const I18nIsStrongPassword = () => {
	return applyDecorators(
		IsStrongPassword({
			message: i18nValidationMessage<I18nTranslations>('validations.password.invalid.weak'),
		}),
	);
};

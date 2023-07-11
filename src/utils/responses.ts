import type { Class, Email, I18nTranslations } from '@types';

import { PathImpl2 } from '@nestjs/config';
import { I18nContext, I18nService } from 'nestjs-i18n';

function generic(
	key: PathImpl2<I18nTranslations>,
	args: Record<string, unknown>,
	i18n: I18nService<I18nTranslations>,
): string {
	return i18n.t(key, {
		lang: I18nContext.current()?.lang ?? undefined, // undefined -> fallback language
		args,
	});
}

interface Response {
	/** The i18n Service used to translate the response */
	i18n: I18nService<I18nTranslations>;
}

interface NamedResponse<T> extends Response {
	/** The object concerned by the translation */
	type: Class<T>;
}

///* ERRORS *///
/**
 * Get the translated error for an invalid payload
 * @returns {string} The translated error
 */
export const authInvalidPayload = (options: Response): string =>
	generic('responses.errors.auth.invalid_payload', {}, options.i18n);

/**
 * Get the translated error for an invalid ID
 * @returns {string} The translated error
 */
export const idInvalid = <T>(options: NamedResponse<T> & { id: string | number }): string =>
	generic('responses.errors.id.invalid', { type: options.type.name, id: options.id }, options.i18n);

/**
 * Get the translated error for a not found ID
 * @returns {string} The translated error
 */
export const idNotFound = <T>(options: NamedResponse<T> & { id: string | number }): string =>
	generic('responses.errors.id.invalid', { type: options.type.name, id: options.id }, options.i18n);

/**
 * Get the translated error for a missing ID
 * @returns {string} The translated error
 */
export const idOrEmailMissing = <T>(options: NamedResponse<T>): string =>
	generic('responses.errors.id_or_email.missing', { type: options.type.name }, options.i18n);

/**
 * Get the translated error for an invalid email
 * @returns {string} The translated error
 */
export const emailInvalid = (options: Response & { email: Email }): string =>
	generic('responses.errors.email.invalid', { email: options.email }, options.i18n);

/**
 * Get the translated error for an already used email
 * @returns {string} The translated error
 */
export const emailAlreadyUsed = (options: Response & { email: string }): string =>
	generic('responses.errors.email.used', { email: options.email }, options.i18n);

/**
 * Get the translated error for a not found email
 * @returns {string} The translated error
 */
export const emailNotFound = <T>(options: NamedResponse<T> & { email: string }): string =>
	generic('responses.errors.email.not_found', { type: options.type.name, email: options.email }, options.i18n);

/**
 * Get the translated error for an already verified email
 * @returns {string} The translated error
 */
export const emailAlreadyVerified = <T>(options: NamedResponse<T>): string =>
	generic('responses.errors.email.verified', { type: options.type.name }, options.i18n);

/**
 * Get the translated error for an unverified email
 * @returns {string} The translated error
 */
export const emailNotVerified = <T>(options: NamedResponse<T>): string =>
	generic('responses.errors.email.unverified', { type: options.type.name }, options.i18n);

/**
 * Get the translated error for an invalid email token
 * @returns {string} The translated error
 */
export const emailInvalidToken = (options: Response): string =>
	generic('responses.errors.email.token.invalid', {}, options.i18n);

/**
 * Get the translated error for an expired email token
 * @returns {string} The translated error
 */
export const birthdayInvalid = (options: Response & { date: Date | string }): string =>
	generic(
		'responses.errors.birthday.invalid',
		{ date: typeof options.date === 'string' ? options.date : options.date.toISOString() },
		options.i18n,
	);

/**
 * Get the translated error for an expired email token
 * @returns {string} The translated error
 */
export const fieldMissing = <T>(options: NamedResponse<T> & { field: unknown }): string =>
	generic('responses.errors.field.missing', { type: options.type.name, field: options.field }, options.i18n);

/**
 * Get the translated error for an unexpected field
 * @returns {string} The translated error
 */
export const fieldUnexpected = <T>(options: NamedResponse<T> & { field: unknown }): string =>
	generic('responses.errors.field.unexpected', { type: options.type.name, field: options.field }, options.i18n);

///* SUCCESS *///
/**
 * Translate the success message for a delete operation
 * @returns {string} The translated success message
 */
export const deleteSuccess = <T>(options: NamedResponse<T>): string =>
	generic('responses.success.deleted', { type: options.type.name }, options.i18n);

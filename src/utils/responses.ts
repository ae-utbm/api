import type { AspectRatio, Class, Email, I18nTranslations } from '@types';

import { PathImpl2 } from '@nestjs/config';
import { I18nContext, I18nService } from 'nestjs-i18n';

function generic(
	key: PathImpl2<I18nTranslations>,
	args: Record<string, unknown>,
	i18n: I18nService<I18nTranslations>,
): string {
	return i18n.t(key, {
		lang: I18nContext.current()?.lang ?? undefined, // undefined -> fallback language
		args: {
			...args,

			// Either we have a class -> get its name, or we have a string -> use it directly
			// > Undefined -> fallback to undefined
			type: args['type'] ? (typeof args['type'] === 'function' ? args['type'].name : args['type']) : undefined,
		},
	});
}

interface Response {
	/** The i18n Service used to translate the response */
	i18n: I18nService<I18nTranslations>;
}

interface NamedResponse<T> extends Response {
	/** The object concerned by the translation */
	type: Class<T> | string;
}

///* ERRORS *///
/**
 * Get the translated error for an invalid ID
 */
export const idInvalid = <T>(options: NamedResponse<T> & { id: string | number }): string =>
	generic('responses.errors.id.invalid', { type: options.type, id: options.id }, options.i18n);

/**
 * Get the translated error for a not found ID
 */
export const idNotFound = <T>(options: NamedResponse<T> & { id: string | number }): string =>
	generic('responses.errors.id.not_found', { type: options.type, id: options.id }, options.i18n);

/**
 * Get the translated error for a missing ID
 */
export const idOrEmailMissing = <T>(options: NamedResponse<T>): string =>
	generic('responses.errors.id_or_email.missing', { type: options.type }, options.i18n);

/**
 * Error for an invalid image aspect ratio
 */
export const imageInvalidAspectRatio = (options: Response & { aspect_ratio: AspectRatio }): string =>
	generic('responses.errors.image.invalid_aspect_ratio', { aspect_ration: options.aspect_ratio }, options.i18n);

/**
 * Error when the expected file is not an image
 */
export const imageInvalidMimeType = (options: Response): string =>
	generic('responses.errors.image.invalid_mime_type', {}, options.i18n);

/**
 * Get the translated error for an invalid email
 */
export const emailInvalid = (options: Response & { email: Email }): string =>
	generic('responses.errors.email.invalid', { email: options.email }, options.i18n);

/**
 * Get the translated error for an already used email
 */
export const emailAlreadyUsed = (options: Response & { email: string }): string =>
	generic('responses.errors.email.used', { email: options.email }, options.i18n);

/**
 * Get the translated error for a not found email
 */
export const emailNotFound = <T>(options: NamedResponse<T> & { email: string }): string =>
	generic('responses.errors.email.not_found', { type: options.type, email: options.email }, options.i18n);

/**
 * Get the translated error for an already verified email
 */
export const emailAlreadyVerified = <T>(options: NamedResponse<T>): string =>
	generic('responses.errors.email.verified', { type: options.type }, options.i18n);

/**
 * Get the translated error for an unverified email
 */
export const emailNotVerified = <T>(options: NamedResponse<T>): string =>
	generic('responses.errors.email.unverified', { type: options.type }, options.i18n);

/**
 * Get the translated error for an invalid email token
 */
export const emailInvalidToken = (options: Response): string =>
	generic('responses.errors.email.token.invalid', {}, options.i18n);

/**
 * Get the translated error for an expired email token
 */
export const birthdayInvalid = (options: Response & { date: Date | string }): string =>
	generic(
		'responses.errors.birthday.invalid',
		{ date: typeof options.date === 'string' ? options.date : options.date.toISOString() },
		options.i18n,
	);

/**
 * Get the translated error for an expired email token
 */
export const fieldMissing = <T>(options: NamedResponse<T> & { field: unknown }): string =>
	generic('responses.errors.field.missing', { type: options.type, field: options.field }, options.i18n);

/**
 * Get the translated error for an unexpected field
 */
export const fieldUnexpected = <T>(options: NamedResponse<T> & { field: unknown }): string =>
	generic('responses.errors.field.unexpected', { type: options.type, field: options.field }, options.i18n);

/**
 * Get the translated error for a password mismatch
 */
export const passwordMismatch = (options: Response): string =>
	generic('responses.errors.password.mismatch', {}, options.i18n);

/**
 * Get the translated error for an invalid permission
 */
export const permissionInvalid = (options: Response & { permission: string }): string =>
	generic('responses.errors.permission.invalid', { permission: options.permission }, options.i18n);

export const permissionNotFoundOnUser = (options: Response & { permission: string; user: string }): string =>
	generic(
		'responses.errors.permission.not_found_on_user',
		{ permission: options.permission, user: options.user },
		options.i18n,
	);

export const permissionAlreadyOnUser = (options: Response & { permission: string; user: string }): string =>
	generic(
		'responses.errors.permission.already_on_user',
		{ permission: options.permission, user: options.user },
		options.i18n,
	);

///* SUCCESS *///
/**
 * Translate the success message for a delete operation
 */
export const deleteSuccess = <T>(options: NamedResponse<T>): string =>
	generic('responses.success.deleted', { type: options.type }, options.i18n);

///* NOT FOUND *///
/**
 * Error message when a promotion does not have a logo
 */
export const promotionLogoNotFound = (options: Response & { number: number }) =>
	generic('responses.not_found.promotion.logo', { number: options.number }, options.i18n);

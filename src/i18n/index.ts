import type { aspect_ratio, email as TEmail, I18nTranslations } from '@types';
import type { Class } from 'type-fest';

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

export namespace Errors {
	export namespace Generic {
		export const FieldMissing = <T>(options: NamedResponse<T> & { field: unknown }): string =>
			generic('responses.errors.field.missing', { type: options.type, field: options.field }, options.i18n);

		export const FieldInvalid = <T>(options: NamedResponse<T> & { field: unknown }): string =>
			generic('responses.errors.field.invalid', { type: options.type, field: options.field }, options.i18n);

		export const FieldUnexpected = <T>(options: NamedResponse<T> & { field: unknown }): string =>
			generic('responses.errors.field.unexpected', { type: options.type, field: options.field }, options.i18n);

		export const IdInvalid = <T>(options: NamedResponse<T> & { id: string | number }): string =>
			generic('responses.errors.id.invalid', { type: options.type, id: options.id }, options.i18n);

		export const IdNotFound = <T>(options: NamedResponse<T> & { id: string | number }): string =>
			generic('responses.errors.id.not_found', { type: options.type, id: options.id }, options.i18n);

		export const IdOrEmailMissing = <T>(options: NamedResponse<T>): string =>
			generic('responses.errors.id_or_email.missing', { type: options.type }, options.i18n);

		export const NotFound = <T>(options: NamedResponse<T> & { field: string; value: string }): string =>
			generic(
				'responses.errors.entity.not_found',
				{ type: options.type, field: options.field, value: options.value },
				options.i18n,
			);
	}

	export namespace BirthDate {
		export const Invalid = (options: Response & { date: Date | string }): string =>
			generic(
				'responses.errors.birth_date.invalid',
				{ date: typeof options.date === 'string' ? options.date : options.date.toISOString() },
				options.i18n,
			);
	}

	export namespace Email {
		export const Invalid = (options: Response & { email: TEmail }): string =>
			generic('responses.errors.email.invalid', { email: options.email }, options.i18n);

		export const AlreadyUsed = (options: Response & { email: string }): string =>
			generic('responses.errors.email.used', { email: options.email }, options.i18n);

		export const AlreadyVerified = <T>(options: NamedResponse<T>): string =>
			generic('responses.errors.email.verified', { type: options.type }, options.i18n);

		export const InvalidVerificationToken = (options: Response): string =>
			generic('responses.errors.email.token.invalid', {}, options.i18n);

		export const NotVerified = <T>(options: NamedResponse<T>): string =>
			generic('responses.errors.email.unverified', { type: options.type }, options.i18n);

		export const NotFound = <T>(options: NamedResponse<T> & { email: string }): string =>
			generic('responses.errors.email.not_found', { type: options.type, email: options.email }, options.i18n);
	}

	export namespace File {
		export const NotProvided = (options: Response): string =>
			generic('responses.errors.file.no_file', {}, options.i18n);

		export const NotFoundOnDisk = (options: Response & { file: string }): string =>
			generic('responses.errors.file.not_found_on_disk', { file: options.file }, options.i18n);
	}

	export namespace Image {
		export const InvalidAspectRatio = (options: Response & { aspect_ratio: aspect_ratio }): string =>
			generic('responses.errors.image.invalid_aspect_ratio', { aspect_ration: options.aspect_ratio }, options.i18n);

		export const InvalidMimeType = (options: Response): string =>
			generic('responses.errors.image.invalid_mime_type', {}, options.i18n);
	}

	export namespace JWT {
		export const Invalid = (options: Response): string => generic('responses.errors.jwt.invalid', {}, options.i18n);
		export const Expired = (options: Response): string => generic('responses.errors.jwt.expired', {}, options.i18n);

		/* istanbul ignore next-line */
		export const Unknown = (options: Response): string => generic('responses.errors.jwt.unknown', {}, options.i18n);
	}

	export namespace Password {
		export const Weak = (options: Response): string => generic('responses.errors.password.weak', {}, options.i18n);

		export const Mismatch = (options: Response): string =>
			generic('responses.errors.password.mismatch', {}, options.i18n);
	}

	export namespace Permission {
		export const AlreadyOnUser = (options: Response & { permission: string; user: string }): string =>
			generic(
				'responses.errors.permission.already_on_user',
				{ permission: options.permission, user: options.user },
				options.i18n,
			);

		export const Invalid = (options: Response & { permission: string }): string =>
			generic('responses.errors.permission.invalid', { permission: options.permission }, options.i18n);

		export const NotFoundOnUser = (options: Response & { permission: string; user: string }): string =>
			generic(
				'responses.errors.permission.not_found_on_user',
				{ permission: options.permission, user: options.user },
				options.i18n,
			);
	}

	export namespace Promotion {
		export const LogoNotFound = (options: Response & { number: number }) =>
			generic('responses.errors.promotion.logo_not_found', { number: options.number }, options.i18n);
	}

	export namespace Role {
		export const NameAlreadyUsed = (options: Response & { name: string }): string =>
			generic('responses.errors.role.name_used', { name: options.name }, options.i18n);
	}
}

export namespace Success {
	export namespace Generic {
		export const Deleted = <T>(options: NamedResponse<T>): string =>
			generic('responses.success.deleted', { type: options.type }, options.i18n);
	}
}

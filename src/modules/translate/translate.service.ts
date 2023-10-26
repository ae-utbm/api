/* istanbul ignore file */
// TODO: (KEY: 7) Add crowdin support

import type { aspect_ratio, email } from '#types';
import type { I18nTranslations, PERMISSION_NAMES } from '#types/api';

import { Injectable } from '@nestjs/common';
import { PathImpl2 } from '@nestjs/config';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Class } from 'type-fest';

@Injectable()
export class TranslateService {
	constructor(private readonly i18n: I18nService<I18nTranslations>) {}

	private generic(key: PathImpl2<I18nTranslations>, args: Record<string, unknown>): string {
		return this.i18n.t(key, {
			lang: I18nContext.current()?.lang ?? undefined, // undefined -> fallback language
			args: {
				...args,

				// Either we have a class -> get its name, or we have a string -> use it directly
				// > Undefined -> fallback to undefined
				type: args['type'] ? (typeof args['type'] === 'function' ? args['type'].name : args['type']) : undefined,
			},
		});
	}

	public readonly Errors = {
		BirthDate: {
			Invalid: (date: Date | string) =>
				this.generic('responses.errors.birth_date.invalid', {
					date: typeof date === 'string' ? date : date.toISOString(),
				}),
		},
		Email: {
			AreAlreadyUsed: (emails: email[]) =>
				this.generic('responses.errors.email.are_used', { emails: emails.sort().join(', ') }),
			IsAlreadyUsed: (email: email) => this.generic('responses.errors.email.used', { email }),
			AlreadyVerified: <T>(type: Class<T> | string) =>
				this.generic('responses.errors.email.already_verified', { type }),
			Blacklisted: (email: email) => this.generic('responses.errors.email.blacklisted', { email }),
			Invalid: (email: email) => this.generic('responses.errors.email.invalid', { email }),
			InvalidVerificationToken: () => this.generic('responses.errors.email.token.invalid', {}),
			Malformed: (email: email) => this.generic('responses.errors.email.malformed', { email }),
			NotVerified: <T>(type: Class<T> | string) => this.generic('responses.errors.email.unverified', { type }),
			NotFound: <T>(type: Class<T> | string, email: email) =>
				this.generic('responses.errors.email.not_found', { type, email }),
		},
		Entity: {
			NotFound: <T>(type: Class<T> | string, field: string, value: string) =>
				this.generic('responses.errors.entity.not_found', { type, field, value: value }),
		},
		File: {
			Infected: (file: string) => this.generic('responses.errors.file.infected', { file }),
			InvalidMimeType: (mime_type: string[]) =>
				this.generic('responses.errors.file.invalid_mime_type', { mime_type: mime_type.join(', ') }),
			NotProvided: () => this.generic('responses.errors.file.no_file', {}),
			NotFoundOnDisk: (file: string) => this.generic('responses.errors.file.not_found_on_disk', { file }),
			UndefinedMimeType: () => this.generic('responses.errors.file.undefined_mime_type', {}),
			Unauthorized: (visibility_group: string) =>
				this.generic('responses.errors.file.unauthorized', { visibility_group }),
		},
		Id: {
			Invalid: <T>(type: Class<T> | string, id: string | number) =>
				this.generic('responses.errors.id.invalid', { type, id }),
			Invalids: <T>(type: Class<T> | string, ids: (string | number)[]) =>
				this.generic('responses.errors.id.invalids', { type, ids: ids.join(', ') }),
			NotFound: <T>(type: Class<T> | string, id: string | number) =>
				this.generic('responses.errors.id.not_found', { type, id }),
			NotFounds: <T>(type: Class<T> | string, ids: (string | number)[]) =>
				this.generic('responses.errors.id.not_founds', { type, ids: ids.join(', ') }),
		},
		Image: {
			InvalidAspectRatio: (aspect_ratio: aspect_ratio) =>
				this.generic('responses.errors.image.invalid_aspect_ratio', { aspect_ratio }),
		},
		JWT: {
			Expired: () => this.generic('responses.errors.jwt.expired', {}),
			Invalid: () => this.generic('responses.errors.jwt.invalid', {}),
			Unknown: () => this.generic('responses.errors.jwt.unknown', {}),
		},
		Password: {
			Mismatch: () => this.generic('responses.errors.password.mismatch', {}),
			Weak: () => this.generic('responses.errors.password.weak', {}),
		},
		Permission: {
			AlreadyOnUser: (permission: PERMISSION_NAMES, user: string) =>
				this.generic('responses.errors.permission.already_on_user', { permission, user }),
			Invalid: (permission: string) => this.generic('responses.errors.permission.invalid', { permission }),
			NotFoundOnUser: (permission: PERMISSION_NAMES, user: string) =>
				this.generic('responses.errors.permission.not_found_on_user', { permission, user }),
		},
		Promotion: {
			LogoNotFound: (number: number) => this.generic('responses.errors.promotion.logo_not_found', { number }),
		},
		Role: {
			NameAlreadyUsed: (name: string) => this.generic('responses.errors.role.name_used', { name }),
		},
		User: {
			CannotUpdateBirthDateOrName: () => this.generic('responses.errors.user.cannot_update_birth_date_or_name', {}),
			PictureCooldown: (time_left: number) => this.generic('responses.errors.user.picture_cooldown', { time_left }),
			NoPicture: (user_id: number | string) => this.generic('responses.errors.user.no_picture', { user_id }),
			NoBanner: (user_id: number | string) => this.generic('responses.errors.user.no_banner', { user_id }),
		},
	};

	public readonly Success = {
		Entity: {
			Deleted: <T>(type: Class<T> | string) => this.generic('responses.success.deleted', { type }),
		},
		Email: {
			Verified: (email: email) => this.generic('responses.success.email.verified', { email }),
		},
	};
}

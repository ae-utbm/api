import type { I18nTranslations, OutputErrorResponseDto } from '#types/api';

import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import { I18nContext, Path, TranslateOptions } from 'nestjs-i18n';

export abstract class I18nHttpException extends Error implements OutputErrorResponseDto {
	/**
	 * Pass a single key and optional args to translate the message
	 * @param key A key from the translation file, e.g. 'validations.user.success.registered'
	 * @param args An optional object containing the args to pass to the translation function
	 */
	constructor(key: Path<I18nTranslations>, args?: TranslateOptions['args']);

	/**
	 * Pass multiple keys (with or without optional args) to be translated and concatenated
	 *
	 * You can use only keys:
	 * @example new OutputMessageDTO(['key.foo.bar', 'another.key'])
	 *
	 * Or specify args for some keys:
	 * @example new OutputMessageDTO(['key.foo.bar', { key: 'another.key', args: { test: 'value' } }])
	 */
	constructor(keys: ({ key: Path<I18nTranslations>; args?: TranslateOptions['args'] } | Path<I18nTranslations>)[]);

	/**
	 * @remark do not use this constructor directly, use the overloads instead
	 */
	constructor(...val: unknown[]) {
		super();

		const ctx = I18nContext.current();
		this.errors = [];

		if (val.length === 1 && Array.isArray(val[0])) {
			// Handle the case where multiple keys (with or without optional args) are passed
			if (val[0].length > 0) {
				const keys = val[0] as (
					| { key: Path<I18nTranslations>; args?: TranslateOptions['args'] }
					| Path<I18nTranslations>
				)[];

				for (const key_or_key_with_args of keys) {
					// if key_or_key_with_args is a string -> use it as key and args as undefined
					if (typeof key_or_key_with_args === 'string') this.errors.push(ctx.t(key_or_key_with_args));
					// else -> use key and args to translate the message
					else this.errors.push(ctx.t(key_or_key_with_args.key, { args: key_or_key_with_args.args }));
				}
			}
		} else if (val.length === 1 && !Array.isArray(val[0])) {
			// Handle the case where a single key is passed without args
			const key = val[0] as Path<I18nTranslations>;

			this.errors.push(ctx.t(key));
		} else if (val.length === 2) {
			// Handle the case where a single key and optional args are passed
			const key = val[0] as Path<I18nTranslations>;
			const args = val[1] as TranslateOptions['args'];

			this.errors.push(ctx.t(key, { args }));
		} else {
			/* istanbul ignore next */
			throw new Error('Invalid constructor arguments');
		}
	}

	errors: string[];

	abstract override message: string;
	abstract statusCode: number;
}

/**
 * Exception filter to make NestJS understand that I18nHttpException behave the same as HttpException does
 * @see https://docs.nestjs.com/exception-filters#binding-filters
 */
@Catch(I18nHttpException)
export class I18nHttpExceptionFilter implements ExceptionFilter {
	catch(exception: I18nHttpException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const status = exception.statusCode;

		response.status(status).json(exception);
	}
}

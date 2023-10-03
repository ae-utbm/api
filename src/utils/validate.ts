import { BadRequestException } from '@nestjs/common';
import { ZodError, ZodTypeAny } from 'zod';

/**
 * Throws a BadRequestException if the given input does not match the given schema
 * @param {ZodObject<T>} schema The schema to validate the input against
 * @param {unknown} input The input to validate
 */
export function validate(schema: ZodTypeAny, input: unknown, error?: string): void | never {
	try {
		schema.parse(input);
	} catch (err) {
		/* istanbul ignore next-line */
		if (!(err instanceof ZodError)) throw err;

		throw new BadRequestException({
			error: 'Bad Request',
			statusCode: 400,
			message: error ?? err.format(),
		});
	}
}

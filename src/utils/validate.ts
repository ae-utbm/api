import { BadRequestException } from '@nestjs/common';
import { ZodError, ZodNumber, ZodObject, ZodRawShape, ZodString } from 'zod';

/**
 * Throws a BadRequestException if the given input does not match the given schema
 * @param {ZodObject<T>} schema The schema to validate the input against
 * @param {unknown} input The input to validate
 */
export function validate<T extends ZodRawShape>(
	schema: ZodObject<T> | ZodNumber | ZodString,
	input: unknown,
): void | never {
	try {
		schema.parse(input);
	} catch (err) {
		if (!(err instanceof ZodError)) throw err;

		throw new BadRequestException({
			error: 'Bad Request',
			statusCode: 400,
			message: err.format(),
		});
	}
}

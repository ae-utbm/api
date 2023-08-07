import type { Class, I18nTranslations, KeysOf } from '@types';

import { BadRequestException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

import { Errors } from '@i18n';

/**
 * Validate fields of an object
 * @param {T} options.object - The object to validate
 * @param {KeysOf<T>} options.requiredKeys - The required fields of the object
 * @param {C | string} options.type - The class / class name of the object to validate
 * @param {I18nService<I18nTranslations>} options.i18n - The i18n service (used to translate the error messages)
 */
export function validateObject<T extends object, C extends Class<unknown>>(options: {
	object: T;
	type: C | string;
	requiredKeys: KeysOf<T>;
	i18n: I18nService<I18nTranslations>;
}): void | never {
	// Get the fields of the object to validate
	const fields = Object.keys(options.object) as KeysOf<T>;

	fields.forEach((field) => {
		// If the field is not required, throw an error (Unexpected field)
		if (!options.requiredKeys.includes(field))
			throw new BadRequestException(Errors.Generic.FieldUnexpected({ i18n: options.i18n, type: options.type, field }));
	});

	options.requiredKeys.forEach((field) => {
		// If the field is required and it is not present, throw an error (Missing field)
		if (!fields.includes(field))
			throw new BadRequestException(Errors.Generic.FieldMissing({ i18n: options.i18n, type: options.type, field }));

		if (options.object[field] === undefined || options.object[field] === null)
			throw new BadRequestException(Errors.Generic.FieldMissing({ i18n: options.i18n, type: options.type, field }));
	});
}

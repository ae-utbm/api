import type { I18nTranslations, KeysOf } from '@types';
import type { Class } from 'type-fest';

import { BadRequestException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

import { Errors } from '@i18n';

export function validateObject<T extends object, C extends Class<unknown>>(options: {
	/** Object to be checked */
	objectToValidate: T;
	/** Class to which the object belongs to */
	objectType: C | string;

	/** Required fields/keys in the given object */
	requiredKeys?: KeysOf<T>;
	/** Optional fields/keys in the given object */
	optionalKeys?: KeysOf<T>;

	/** Translation service */
	i18n: I18nService<I18nTranslations>;
}): void | never {
	if (
		(!options.requiredKeys && !options.optionalKeys) ||
		[...(options.requiredKeys ?? []), ...(options.optionalKeys ?? [])].length === 0
	)
		return; // No keys to validate -> anything is valid

	const keysToValidate = Object.keys(options.objectToValidate);

	keysToValidate.forEach((key) => {
		// Check for unexpected fields in the given object
		if (!options.requiredKeys?.includes(key) && !options.optionalKeys?.includes(key))
			throw new BadRequestException(
				Errors.Generic.FieldUnexpected({ i18n: options.i18n, type: options.objectType, field: key }),
			);
	});

	options.requiredKeys.forEach((field) => {
		// If the field is required but not present, throw an error (Missing field)
		if (!keysToValidate.includes(field))
			throw new BadRequestException(
				Errors.Generic.FieldMissing({ i18n: options.i18n, type: options.objectType, field }),
			);

		if (options.objectToValidate[field] === undefined || options.objectToValidate[field] === null)
			throw new BadRequestException(
				Errors.Generic.FieldMissing({ i18n: options.i18n, type: options.objectType, field }),
			);
	});
}

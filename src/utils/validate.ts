import type { KeysOf } from '@types';
import type { Class } from 'type-fest';

import { BadRequestException } from '@nestjs/common';

import { TranslateService } from '@modules/translate/translate.service';

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
	t: TranslateService;
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
			throw new BadRequestException(options.t.Errors.Field.Unexpected(options.objectType, key));
	});

	options.requiredKeys.forEach((field) => {
		// If the field is required but not present, throw an error (Missing field)
		if (!keysToValidate.includes(field))
			throw new BadRequestException(options.t.Errors.Field.Missing(options.objectType, field));

		if (options.objectToValidate[field] === undefined || options.objectToValidate[field] === null)
			throw new BadRequestException(options.t.Errors.Field.Missing(options.objectType, field));
	});
}

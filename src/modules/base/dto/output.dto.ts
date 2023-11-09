import type {
	OutputErrorResponseDto,
	OutputBaseDto,
	OutputResponseDto,
	HttpStatusNames,
	I18nTranslations,
} from '#types/api';

import { PathImpl2 } from '@nestjs/config';
import { ApiProperty } from '@nestjs/swagger';
import { I18nContext, TranslateOptions } from 'nestjs-i18n';

/**
 * Base read response DTO class (extended by all entity derived read DTOs)
 */
export abstract class OutputBaseDTO implements OutputBaseDto {
	@ApiProperty({ minimum: 1 })
	id: number;

	@ApiProperty({ example: new Date().toISOString() })
	updated: Date;

	@ApiProperty({ example: new Date().toISOString() })
	created: Date;
}

export class OutputMessageDTO implements OutputResponseDto {
	constructor(key: PathImpl2<I18nTranslations>, args?: TranslateOptions['args']) {
		this.message = I18nContext.current().t(key, { args });
	}

	@ApiProperty()
	message: string;

	@ApiProperty({ example: 200 })
	statusCode: number = 200;
}

export class OutputCreatedDTO implements OutputResponseDto {
	constructor(key: PathImpl2<I18nTranslations>, args?: TranslateOptions['args']) {
		this.message = I18nContext.current().t(key, { args });
	}

	@ApiProperty()
	message: string;

	@ApiProperty({ example: 201 })
	statusCode: number = 201;
}

/**
 * Error response DTO class (used to send an error to the client)
 */
export class OutputErrorDTO implements OutputErrorResponseDto {
	@ApiProperty()
	errors: string[];

	@ApiProperty({ example: 'Bad Request' })
	message: HttpStatusNames;

	@ApiProperty({ example: 500 })
	statusCode: number;
}

import type { HttpStatusNames } from '#types/api';

import { I18nHttpException } from './base';

export class i18nBadRequestException extends I18nHttpException {
	override statusCode: number = 400;
	override message: HttpStatusNames = 'Bad Request';
}

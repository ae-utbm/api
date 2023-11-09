import type { HttpStatusNames } from '#types/api';

import { I18nHttpException } from './http-exception';

export class i18nUnauthorizedException extends I18nHttpException {
	override statusCode: number = 401;
	override message: HttpStatusNames = 'Unauthorized';
}

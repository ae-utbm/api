import type { HttpStatusNames } from '#types/api';

import { I18nHttpException } from './http-exception';

export class i18nForbiddenException extends I18nHttpException {
	override statusCode: number = 403;
	override message: HttpStatusNames = 'Forbidden';
}

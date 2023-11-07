import type { HttpStatusNames } from '#types/api';

import { I18nHttpException } from './base';

export class i18nNotFoundException extends I18nHttpException {
	override statusCode: number = 404;
	override message: HttpStatusNames = 'Not Found';
}

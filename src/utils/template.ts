import fs from 'fs';
import path from 'path';

import { PathImpl2 } from '@nestjs/config';
import { I18nContext, I18nService } from 'nestjs-i18n';

import { I18nTranslations } from '#types/api';

export type templates = 'emails/register_user_by_admin' | 'emails/register_user' | 'emails/email_changed';
export type template_args =
	| (
			| {
					[k: string]: unknown;
			  }
			| string
	  )[]
	| {
			[k: string]: unknown;
	  };

/**
 * Load the given template and translate all strings in it
 * @param {templates} templateName The name of the template to load
 * @param {I18nService} i18n The i18n service to use to translate the template
 * @param {template_args?} args Arguments to pass to the translation function (if any)
 * @returns {string} The translated template
 */
export function getTemplate(templateName: templates, i18n: I18nService<I18nTranslations>, args: template_args): string {
	let inputString = fs.readFileSync(path.join(__dirname, `../templates/${templateName}.html`), 'utf8');
	const regex = /\{\{([^}]+)\}\}/g;
	const matches: PathImpl2<I18nTranslations>[] = [];

	let match: RegExpExecArray;
	while ((match = regex.exec(inputString)) !== null) {
		const variant = match[1].trim() as PathImpl2<I18nTranslations>;
		matches.push(variant);
	}

	matches.forEach(
		(match: PathImpl2<I18nTranslations>) =>
			(inputString = inputString.replace(`{{ ${match} }}`, i18n.t(match, { lang: I18nContext.current()?.lang, args }))),
	);
	return inputString;
}

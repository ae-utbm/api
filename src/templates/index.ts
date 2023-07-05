import fs from 'fs';
import { I18nContext, I18nService } from 'nestjs-i18n';
import * as path from 'path';

export type AvailableTemplates = 'emails/register_user_by_admin' | 'emails/register_user';
export type AvailableTemplateArgs =
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
 * @param {AvailableTemplates} templateName The name of the template to load
 * @param {I18nService} i18n The i18n service to use to translate the template
 * @param {AvailableTemplateArgs?} args Arguments to pass to the translation function (if any)
 * @returns {string} The translated template
 */
export function getTemplate(
	templateName: AvailableTemplates,
	i18n: I18nService,
	args: AvailableTemplateArgs = {},
): string {
	let inputString = fs.readFileSync(path.join(__dirname, `./${templateName}.html`), 'utf8');
	const regex = /\{\{([^}]+)\}\}/g;
	const matches = [];

	let match: RegExpExecArray;
	while ((match = regex.exec(inputString)) !== null) {
		const variant = match[1].trim();
		matches.push(variant);
	}

	console.log(matches, I18nContext.current());
	matches.forEach((match) => inputString = inputString.replace(`{{ ${match} }}`, i18n.t(match, { lang: I18nContext.current().lang, args })));
	return inputString;
}

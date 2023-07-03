import type { email } from '@types';

import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

import env from '@env';

/**
 * Check if an email is allowed to be used (to register for example) and if it is valid
 * @param {email} email the email to check
 * @returns {boolean} true if the email is allowed, false otherwise
 */
export function checkEmail(email: email): boolean {
	const blacklist = env().email.blacklist.host;
	const whitelisted = env().email.whitelist.email;

	if (whitelisted.includes(email)) return true;
	else if (blacklist.some((host) => email.endsWith(host))) return false;

	const regex = new RegExp(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/);
	return regex.test(email);
}

const transporter = nodemailer.createTransport({
	host: env().email.host,
	port: env().email.port,
	secure: env().email.secure,
	auth: {
		user: env().email.auth.user,
		pass: env().email.auth.pass,
	},
});

interface EmailOptions {
	to: string[];
	subject: string;
	templates_args: Record<string, string>;
}

/**
 * Send en email based on a template and given data
 * @param {string} template filename located in `src/utils/templates/emails`
 * @param {EmailOptions} options the options for the email
 */
export async function sendEmail(template: string, options: EmailOptions): Promise<void> {
	let html = fs.readFileSync(path.join(__dirname, '../../../templates/emails', template + '.html'), {
		encoding: 'utf-8',
	});

	Object.keys(options.templates_args).forEach((key) => {
		html = html.replaceAll(`{{ ${key} }}`, options.templates_args[key]);
	});

	await transporter.sendMail({
		from: `ae.noreply@utbm.fr`,
		to: options.to.join(', '),
		subject: options.subject,
		html,
	});
}

/* istanbul ignore file */

import type { email } from '@types';

import { createTransport } from 'nodemailer';

import env from '@env';

/**
 * Check if an email is allowed to be used (to register for example) and if it is valid
 * @see https://emailregex.com/
 *
 * @param {email} email the email to check
 * @returns {boolean} true if the email is allowed, false otherwise
 */
export function checkEmail(email: email): boolean {
	const blacklist = env().email.blacklist.host;
	const whitelisted = env().email.whitelist.email;

	if (whitelisted.includes(email)) return true;
	else if (blacklist.some((host) => email.endsWith(host))) return false;

	const regex = new RegExp(
		/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
	);
	return regex.test(email);
}

const transporter =
	env().email.enabled === false
		? undefined
		: createTransport({
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
	from?: string;
	subject: string;
	html: string;
}

/**
 * Send en email based on a template and given data
 * @param {EmailOptions} options the options for the email
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
	if (!transporter || env().email.enabled === false) return;

	await transporter.sendMail({
		from: options.from ?? `noreply@ae.utbm.fr`,
		to: options.to.join(', '),
		subject: options.subject,
		html: options.html,
	});
}

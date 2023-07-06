import type { email } from '@types';

import * as nodemailer from 'nodemailer';
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
	from?: string;
	subject: string;
	html: string;
}

/**
 * Send en email based on a template and given data
 * @param {EmailOptions} options the options for the email
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
	if (env().email.disabled) return;

	await transporter.sendMail({
		from: options.from ?? `ae.noreply@utbm.fr`,
		to: options.to.join(', '),
		subject: options.subject,
		html: options.html,
	});
}

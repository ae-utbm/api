/* istanbul ignore file */
// TODO: (KEY: 3) Find a way to test emails (sending / receiving)

import type { email } from '#types';

import { BadRequestException, Injectable } from '@nestjs/common';
import { Transporter, createTransport } from 'nodemailer';

import { env } from '@env';
import { TranslateService } from '@modules/translate/translate.service';

interface EmailOptions {
	to: string[];
	from?: string;
	subject: string;
	html: string;
}

@Injectable()
export class EmailsService {
	readonly transporter?: Transporter;

	constructor(private readonly t: TranslateService) {
		this.transporter =
			env.EMAIL_ENABLED === false
				? undefined
				: createTransport({
						host: env.EMAIL_HOST,
						port: env.EMAIL_PORT,
						secure: env.EMAIL_SECURE,
						auth: {
							user: env.EMAIL_AUTH_USER,
							pass: env.EMAIL_AUTH_PASS,
						},
				  });
	}

	/**
	 * Check if an email is allowed to be used (to register for example) and if it is valid
	 * @see https://emailregex.com/
	 *
	 * @param email
	 */
	validateEmail(email: email): void | never {
		if (typeof email !== 'string' || !email.includes('@'))
			throw new BadRequestException(this.t.Errors.Email.Invalid(email));

		if (email.length > 60 || email.length < 6) throw new BadRequestException(this.t.Errors.Email.Malformed(email));

		const whitelisted = {
			hosts: env.WHITELISTED_HOSTS.split(';'),
			emails: env.WHITELISTED_EMAILS.split(';'),
		};

		const blacklisted = {
			hosts: env.BLACKLISTED_HOSTS.split(';'),
			emails: env.BLACKLISTED_EMAILS.split(';'),
		};

		if (whitelisted.hosts.some((host) => email.endsWith(host)) || whitelisted.emails.includes(email)) return;
		if (blacklisted.hosts.some((host) => email.endsWith(host)) || blacklisted.emails.includes(email))
			throw new BadRequestException(this.t.Errors.Email.Blacklisted(email));

		const regex = new RegExp(
			/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
		);
		if (!regex.test(email)) throw new BadRequestException(this.t.Errors.Email.Invalid(email));
	}

	async sendEmail(options: EmailOptions) {
		if (!this.transporter || env.EMAIL_ENABLED === false) return;

		await this.transporter.sendMail({
			from: options.from ?? `noreply@ae.utbm.fr`,
			to: options.to.join(', '),
			subject: options.subject,
			html: options.html,
		});
	}
}

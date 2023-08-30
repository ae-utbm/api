import type { I18nTranslations, email } from '@types';

import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { Transporter, createTransport } from 'nodemailer';

import { Errors } from '@i18n';

interface EmailOptions {
	to: string[];
	from?: string;
	subject: string;
	html: string;
}

@Injectable()
export class EmailsService {
	readonly transporter?: Transporter;

	constructor(private readonly configService: ConfigService, private readonly i18n: I18nService<I18nTranslations>) {
		this.transporter =
			this.configService.get<boolean>('email.enabled') === false
				? undefined
				: createTransport({
						host: this.configService.get<string>('email.host'),
						port: this.configService.get<number>('email.port'),
						secure: this.configService.get<boolean>('email.secure'),
						auth: {
							user: this.configService.get<string>('email.auth.user'),
							pass: this.configService.get<string>('email.auth.pass'),
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
			throw new BadRequestException(Errors.Email.Invalid({ email, i18n: this.i18n }));

		if (email.length > 60 || email.length < 6)
			throw new BadRequestException(Errors.Email.Malformed({ email, i18n: this.i18n }));

		const whitelisted = this.configService.get<string[]>('email.whitelist');
		const blacklisted = this.configService.get<string[]>('email.blacklist.host');

		if (whitelisted.includes(email)) return;
		if (blacklisted.some((host) => email.endsWith(host)))
			throw new BadRequestException(Errors.Email.Blacklisted({ email, i18n: this.i18n }));

		const regex = new RegExp(
			/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
		);
		if (!regex.test(email)) throw new BadRequestException(Errors.Email.Invalid({ email, i18n: this.i18n }));
	}

	async sendEmail(options: EmailOptions) {
		if (!this.transporter || this.configService.get<boolean>('email.enabled') === false) return;

		await this.transporter.sendMail({
			from: options.from ?? `noreply@ae.utbm.fr`,
			to: options.to.join(', '),
			subject: options.subject,
			html: options.html,
		});
	}
}

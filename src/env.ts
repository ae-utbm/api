/* istanbul ignore file */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import 'dotenv/config';

import { Logger } from '@nestjs/common';
import { z } from 'zod';

/**
 * NodeJS environment variables + API specific environment variables, validated using zod
 */
export const env = (() => {
	// Throw if the .env file is missing
	if (!existsSync(join(process.cwd(), '.env'))) {
		Logger.error(
			"Cannot start the server, the '.env' file is missing, have you copied and edited the '.env.example' file?",
			'env.ts',
		);
		process.exit(1);
	}

	const refineAsEmail = (str: string) => {
		str.split(';').every((s) => {
			z.string().email().parse(s);
		});
		return true;
	};

	const refineAsHost = (str: string) => {
		str.split(';').every((s) => {
			z.string().startsWith('@').parse(s);
		});
		return true;
	};

	// Validate the environment variables using zod
	const schema = z.object({
		API_PORT: z.coerce.number().min(0),
		API_URL: z.string().url(),

		CORS_ORIGIN_WHITELIST: z.string().refine((str) => str.split(';').every((s) => s.startsWith('http') || s === '*'), {
			message: 'The CORS_ORIGIN_WHITELIST environment variable must be a list of origins separated by a semicolon (;)',
		}),
		DEBUG: z.enum(['true', 'false']).transform((value) => value === 'true'),

		JWT_KEY: z.string().min(1),
		JWT_EXPIRATION_TIME: z.coerce.number().min(0),

		POSTGRES_DB: z.string(),
		POSTGRES_HOST: z.string().ip({ version: 'v4' }),
		POSTGRES_PASSWORD: z.string().optional(),
		POSTGRES_PORT: z.coerce.number().min(0),
		POSTGRES_USER: z.string(),

		FILES_BASE_DIR: z.string().startsWith('./'),

		PROMOTION_BASE_PATH: z.string().startsWith('./'),

		USERS_PICTURES_DELAY: z.coerce.number().min(0),
		USERS_VERIFICATION_DELAY: z.coerce.number().min(0),
		USERS_BASE_PATH: z.string().startsWith('./'),

		EMAIL_HOST: z.string(),
		EMAIL_PORT: z.coerce.number().min(0),
		EMAIL_SECURE: z.enum(['true', 'false']).transform((value) => value === 'true'),
		EMAIL_AUTH_USER: z.string().email(),
		EMAIL_AUTH_PASS: z.string(),
		EMAIL_ENABLED: z.enum(['true', 'false']).transform((value) => value === 'true'),

		WHITELISTED_HOSTS: z.string().refine(refineAsHost, {
			message: 'Should be a list of emails host, each starting with arobase (@) and separated with a semicolon (;)',
		}),
		WHITELISTED_EMAILS: z
			.string()
			.refine(refineAsEmail, { message: 'Should be a list of emails separated by a semicolon (;)' }),

		BLACKLISTED_HOSTS: z.string().refine(refineAsHost, {
			message: 'Should be a list of emails host, each starting with arobase (@) and separated with a semicolon (;)',
		}),
		BLACKLISTED_EMAILS: z
			.string()
			.refine(refineAsEmail, { message: 'Should be a list of  emails separated by a semicolon (;)' }),
	});

	return schema.parse(process.env) as NodeJS.ProcessEnv &
		Required<Omit<ReturnType<typeof schema.parse>, 'POSTGRES_PASSWORD'>> & {
			POSTGRES_PASSWORD?: string;
		};
})();

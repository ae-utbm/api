import { join } from 'path';

export type Config = typeof config;

const config = () => ({
	production: process.env['DEBUG'] !== 'true',
	api_url:
		process.env['DEBUG'] === 'true'
			? `http://localhost:${parseInt(process.env['API_PORT'], 10) || 3000}`
			: 'https://ae.utbm.fr/api',
	port: parseInt(process.env['API_PORT'], 10) || 3000,
	cors: process.env['DEBUG'] === 'true' ? ['*'] : process.env['CORS_ORIGIN_WHITELIST']?.split(';'),
	auth: {
		jwtKey: process.env['JWT_KEY'],
		jwtExpirationTime: parseInt(process.env['JWT_EXPIRATION_TIME'], 10) || 60 * 60 * 24 * 7 * 1000, // 1 week
	},
	files: {
		baseDir: join(process.cwd(), process.env['FILES_BASE_DIR'] || './public'),
		users: join(process.cwd(), process.env['USERS_PATH'] || './public/users'),
		promotions: join(process.cwd(), process.env['PROMOTIONS_LOGO_PATH'] || './public/promotions'),
	},
	users: {
		verification_token_validity: 7, // number of days before the account being deleted
		picture_cooldown: parseInt(process.env['USERS_PICTURES_DELAY'], 10) || 60 * 60 * 24 * 7 * 1000, // 1 week
	},
	email: {
		enabled: process.env['EMAIL_ENABLED'] === 'true',
		host: process.env['EMAIL_HOST'],
		port: parseInt(process.env['EMAIL_PORT'], 10) || 465,
		secure: process.env['EMAIL_SECURE'] === 'true',
		auth: {
			user: process.env['EMAIL_AUTH_USER'],
			pass: process.env['EMAIL_AUTH_PASS'],
		},
		whitelist: {
			hosts: process.env['WHITELISTED_HOSTS']?.split(';') ?? [],
			emails: ['ae.info@utbm.fr', ...(process.env['WHITELISTED_EMAILS']?.split(';') ?? [])],
		},
		blacklist: {
			hosts: ['@utbm.fr', ...(process.env['BLACKLISTED_HOSTS']?.split(';') ?? [])],
			emails: process.env['BLACKLISTED_EMAILS']?.split(';') ?? [],
		},
	},
});

export default config;

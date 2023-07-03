import { join } from 'path';

export default () => ({
	production: process.env['DEBUG'] === 'false',
	port: parseInt(process.env['API_PORT'], 10) || 3000,
	auth: {
		jwtKey: process.env['JWT_KEY'],
		jwtExpirationTime: parseInt(process.env['JWT_EXPIRATION_TIME'], 10) || 60 * 60 * 24 * 7, // 1 week
	},
	files: {
		baseDir: join(process.cwd(), process.env['FILES_BASE_DIR'] || './public'),
		usersPicturesDelay: parseInt(process.env['USERS_PICTURES_DELAY'], 10) || 60 * 60 * 24 * 7, // 1 week
		users: join(process.cwd(), process.env['USERS_PATH'] || './public/users'),
		promotions: join(process.cwd(), process.env['PROMOTIONS_LOGO_PATH'] || './public/promotions'),
	},
	email: {
		host: process.env['EMAIL_HOST'],
		port: parseInt(process.env['EMAIL_PORT'], 10) || 465,
		secure: process.env['EMAIL_SECURE'] === 'true',
		auth: {
			user: process.env['EMAIL_AUTH_USER'],
			pass: process.env['EMAIL_AUTH_PASS'],
		},
		whitelist: {
			// Email addresses that are allowed to be used to register
			// even if they're domain is blacklisted
			email: ['ae.info@utbm.fr', ...(process.env['WHITELISTED_EMAILS']?.split(';') ?? [])],
		},
		blacklist: {
			host: ['@utbm.fr', ...(process.env['BLACKLISTED_HOSTS']?.split(';') ?? [])],
		},
	},
	cors: process.env['DEBUG'] === 'true' ? '*' : process.env['CORS_ORIGIN_WHITELIST']?.split(';'),
});

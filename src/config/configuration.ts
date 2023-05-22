import { join } from 'path';

export default () => ({
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
});

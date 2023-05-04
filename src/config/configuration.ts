export default () => ({
	port: parseInt(process.env.API_PORT, 10) || 3000,
	auth: {
		jwtKey: process.env.JWT_KEY,
		jwtExpirationTime: parseInt(process.env.JWT_EXPIRATION_TIME, 10) || 60 * 60 * 24 * 7, // 1 week
	},
	files: {
		usersPictures: process.env.USERS_PICTURES_PATH || './public/users/pictures',
		usersBanners: process.env.USERS_BANNERS_PATH || './public/users/banners',
	},
});

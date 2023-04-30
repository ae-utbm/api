export default () => ({
	port: parseInt(process.env.API_PORT, 10) || 3000,
	auth: {
		jwtKey: process.env.JWT_KEY,
		jwtExpirationTime: process.env.JWT_EXPIRATION_TIME || '15m',
		jwtAccessExpirationTime: parseInt(process.env.JWT_ACCESS_EXPIRATION_TIME, 10) || 60 * 60 * 24 * 1, // 1 day
		jwtRefreshExpirationTime: parseInt(process.env.JWT_REFRESH_EXPIRATION_TIME, 10) || 60 * 60 * 24 * 30, // 30 days
	},
});

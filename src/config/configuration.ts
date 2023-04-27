export default () => ({
	port: parseInt(process.env.API_PORT, 10) || 3000,
	auth: {
		jwtKey: process.env.JWT_KEY,
		jwtExpirationTime: process.env.JWT_EXPIRATION_TIME,
	},
});

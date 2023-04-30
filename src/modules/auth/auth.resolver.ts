import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { UserInputError } from '@nestjs/apollo';
import { TokenObject } from './models/token.model';
import { ConfigService } from '@nestjs/config';

@Resolver()
export class AuthResolver {
	constructor(private authService: AuthService, private configService: ConfigService) {}

	/**
	 * Validates a user's credentials and returns a token object containing an access token and a refresh token.
	 * @param {string} email email address of the user
	 * @param {string} password user's password
	 * @returns {Promise<TokenObject>} a promise with the token object containing an access token and a refresh token
	 *
	 * @throws {UserInputError} if the user's credentials are invalid
	 */
	@Mutation(() => TokenObject)
	async login(@Args('email') email: string, @Args('password') password: string): Promise<TokenObject> {
		const user = await this.authService.validateUser(email, password);
		if (!user) throw new UserInputError('Invalid email or password');

		const accessToken = await this.authService.generateAccessToken(user.id, 60 * 60 * 24 * 1);
		const refreshToken = await this.authService.generateRefreshToken(user.id, 60 * 60 * 24 * 30);

		const tokenObject = new TokenObject();
		tokenObject.accessToken = accessToken;
		tokenObject.refreshToken = refreshToken;

		return tokenObject;
	}

	/**
	 * Registers a new user and returns a token object containing an access token and a refresh token.
	 * @param {string} email main email address of the user
	 * @param {string} password user's password
	 * @returns {Promise<TokenObject>} a promise with the token object containing an access token and a refresh token
	 */
	@Mutation(() => TokenObject)
	async register(
		@Args('email') email: string,
		@Args('password') password: string,
		@Args('first_name') firstName: string,
		@Args('last_name') lastName: string,
		@Args('birthday') birthday: Date,
	): Promise<TokenObject> {
		const user = await this.authService.register({ email, password, firstName, lastName, birthday });
		if (!user) throw new UserInputError(`User with email ${email} already exists.`);

		const accessToken = await this.authService.generateAccessToken(
			user.id,
			this.configService.get<number>('auth.jwtAccessExpirationTime'),
		);
		const refreshToken = await this.authService.generateRefreshToken(
			user.id,
			this.configService.get<number>('auth.jwtRefreshExpirationTime'),
		);

		const tokenObject = new TokenObject();
		tokenObject.accessToken = accessToken;
		tokenObject.refreshToken = refreshToken;

		return tokenObject;
	}

	/**
	 * Refreshes the access token using the refresh token.
	 * @param {string} refresh the refresh token to use
	 * @returns {Promise<TokenObject>} a promise with the token object containing an access token and a refresh token
	 */
	@Mutation(() => TokenObject)
	async refreshToken(@Args('refreshToken') refresh: string): Promise<TokenObject> {
		const { accessToken, refreshToken } = await this.authService.createAccessTokenFromRefreshToken(refresh);

		const tokenObject = new TokenObject();
		tokenObject.accessToken = accessToken;
		tokenObject.refreshToken = refreshToken;

		return tokenObject;
	}
}

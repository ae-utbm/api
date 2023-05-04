import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { UserInputError } from '@nestjs/apollo';
import { TokenObject } from './models/token.model';
import { ConfigService } from '@nestjs/config';
import { UserRegisterArgs } from '../users/models/user-register.args';

@Resolver(() => TokenObject)
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
		tokenObject.user_id = user.id;

		return tokenObject;
	}

	/**
	 * Registers a new user and returns a token object containing an access token and a refresh token.
	 * @param {UserRegisterArgs} input the user's data
	 * @returns {Promise<TokenObject>} a promise with the token object containing an access token and a refresh token
	 */
	@Mutation(() => TokenObject)
	async register(@Args() input: UserRegisterArgs): Promise<TokenObject> {
		const user = await this.authService.register(input);
		if (!user) throw new UserInputError(`User with email ${input.email} already exists.`);

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
		tokenObject.user_id = user.id;

		return tokenObject;
	}

	/**
	 * Refreshes the access token using the refresh token.
	 * @param {string} refresh the refresh token to use
	 * @returns {Promise<TokenObject>} a promise with the token object containing an access token and a refresh token
	 */
	@Mutation(() => TokenObject)
	async refreshToken(@Args('refresh_token') refresh: string): Promise<TokenObject> {
		return await this.authService.createAccessTokenFromRefreshToken(refresh);
	}
}

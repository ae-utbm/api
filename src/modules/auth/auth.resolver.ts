import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginUserPayload } from './dto/login-user.payload';
import { LoginUserInput } from './dto/login-user.input';
import { UserInputError } from '@nestjs/apollo';
import { RefreshTokenInput } from './dto/refresh-token.input';
import { RefreshTokenPayload } from './dto/refresh-token.payload';
import { RegisterUserInput } from './dto/register-user.input';
import { RegisterUserPayload } from './dto/register-user.payload';

@Resolver()
export class AuthResolver {
	constructor(private authService: AuthService) {}

	@Mutation(() => LoginUserPayload)
	async login(@Args('input') input: LoginUserInput) {
		const user = await this.authService.validateUser(input.email, input.password);

		if (!user) return new UserInputError('Invalid email or password');

		const accessToken = await this.authService.generateAccessToken(user);
		const refreshToken = await this.authService.generateRefreshToken(user, 60 * 60 * 24 * 30);

		const payload = new LoginUserPayload();
		payload.user = user;
		payload.accessToken = accessToken;
		payload.refreshToken = refreshToken;

		return payload;
	}

	@Mutation(() => RefreshTokenPayload)
	async refreshToken(@Args('input') input: RefreshTokenInput) {
		const { user, token } = await this.authService.createAccessTokenFromRefreshToken(input.refreshToken);

		const payload = new RefreshTokenPayload();
		payload.user = user;
		payload.accessToken = token;

		return payload;
	}

	@Mutation(() => RegisterUserPayload)
	async register(@Args('input') input: RegisterUserInput) {
		const user = await this.authService.register(input.email, input.password);
		if (!user) return new UserInputError(`User with email ${input.email} already exists.`);

		const accessToken = await this.authService.generateAccessToken(user);
		const refreshToken = await this.authService.generateRefreshToken(user, 60 * 60 * 24 * 30);

		const payload = new RegisterUserPayload();
		payload.user = user;
		payload.accessToken = accessToken;
		payload.refreshToken = refreshToken;

		return payload;
	}
}

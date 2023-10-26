import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { z } from 'zod';

import { MessageResponseDTO } from '@modules/_mixin/dto/message-response.dto';
import { TranslateService } from '@modules/translate/translate.service';
import { User } from '@modules/users/entities/user.entity';
import { UsersDataService } from '@modules/users/services/users-data.service';
import { validate } from '@utils/validate';

import { AuthService } from './auth.service';
import { UserPostDTO } from './dto/register.dto';
import { UserSignInDTO } from './dto/sign-in.dto';
import { TokenDTO } from './dto/token.dto';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
	constructor(
		private readonly t: TranslateService,
		private readonly authService: AuthService,
		private readonly userService: UsersDataService,
	) {}

	@Post('login')
	@ApiOperation({ summary: 'Sign in a user with email and password' })
	@ApiUnauthorizedResponse({ description: 'Unauthorized, password invalid' })
	@ApiNotFoundResponse({ description: 'User not found' })
	@ApiOkResponse({ description: 'OK', type: TokenDTO })
	async login(@Body() signInDto: UserSignInDTO): Promise<TokenDTO> {
		const schema = z
			.object({
				password: z.string(),
				email: z.string().email(),
			})
			.strict();

		validate(schema, signInDto);

		return this.authService.signIn(signInDto.email, signInDto.password);
	}

	@Post('register')
	@ApiOperation({ summary: 'Register a new user' })
	@ApiOkResponse({ description: 'User created', type: User })
	@ApiBadRequestResponse({ description: 'Bad request, invalid fields' })
	async register(@Body() registerDto: UserPostDTO): Promise<User> {
		const schema = z
			.object({
				password: z.string(),
				first_name: z.string(),
				last_name: z.string(),
				email: z.string().email(),
				birth_date: z.string().datetime(),
			})
			.strict();

		validate(schema, registerDto);

		return this.userService.register(registerDto);
	}

	@Get('confirm/:user_id/:token')
	@ApiParam({ name: 'user_id', type: Number })
	@ApiParam({ name: 'token', type: String })
	@ApiOperation({ summary: 'Validate a user account and redirect after' })
	@ApiNotFoundResponse({ description: 'User not found' })
	@ApiBadRequestResponse({ description: 'Bad request, missing id/token or email already verified' })
	@ApiUnauthorizedResponse({ description: 'Unauthorized, invalid token' })
	@ApiOkResponse({ description: 'OK', type: MessageResponseDTO })
	async verifyEmailAndRedirect(@Param('user_id') user_id: number, @Param('token') token: string) {
		validate(z.coerce.number().int().min(1), user_id, this.t.Errors.Id.Invalid(User, user_id));
		validate(z.string().min(12), token, this.t.Errors.JWT.Invalid());

		return this.userService.verifyEmail(user_id, token);
	}
}

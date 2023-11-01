import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiForbiddenResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { z } from 'zod';

import { ErrorResponseDTO } from '@modules/_mixin/dto/error.dto';
import { MessageResponseDTO } from '@modules/_mixin/dto/message.dto';
import { TranslateService } from '@modules/translate/translate.service';
import { User } from '@modules/users/entities/user.entity';
import { UsersDataService } from '@modules/users/services/users-data.service';
import { validate } from '@utils/validate';

import { AuthService } from './auth.service';
import { TokenDTO } from './dto/get.dto';
import { UserPostDTO, SignInDTO } from './dto/post.dto';

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
	@ApiUnauthorizedResponse({ description: 'Unauthorized, password invalid', type: ErrorResponseDTO })
	@ApiForbiddenResponse({ description: 'Forbidden, email not verified', type: ErrorResponseDTO })
	@ApiNotFoundResponse({ description: 'User not found', type: ErrorResponseDTO })
	@ApiOkResponse({ description: 'OK', type: TokenDTO })
	async login(@Body() signInDto: SignInDTO) {
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
	@ApiOkResponse({ description: 'User created', type: MessageResponseDTO })
	@ApiBadRequestResponse({ description: 'Bad request, invalid fields', type: ErrorResponseDTO })
	async register(@Body() registerDto: UserPostDTO) {
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
	@ApiNotFoundResponse({ description: 'User not found', type: ErrorResponseDTO })
	@ApiBadRequestResponse({
		description: 'Missing id/token or email already verified',
		type: ErrorResponseDTO,
	})
	@ApiUnauthorizedResponse({ description: 'Unauthorized, invalid token', type: ErrorResponseDTO })
	@ApiOkResponse({ description: 'OK', type: MessageResponseDTO })
	async verifyEmailAndRedirect(@Param('user_id') user_id: number, @Param('token') token: string) {
		validate(z.coerce.number().int().min(1), user_id, this.t.Errors.Id.Invalid(User, user_id));
		validate(z.string().min(12), token, this.t.Errors.JWT.Invalid());

		return this.userService.verifyEmail(user_id, token);
	}
}

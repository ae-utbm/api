import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';

import { ApiNotOkResponses } from '@modules/_mixin/decorators/error.decorator';
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
	@ApiOkResponse({ description: 'OK', type: TokenDTO })
	@ApiNotOkResponses({
		400: 'Bad Request, invalid fields',
		401: 'Unauthorized, password mismatch',
		403: 'Forbidden, email not verified',
		404: 'User not found',
	})
	async login(@Body() signInDto: SignInDTO): Promise<TokenDTO> {
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
	@ApiNotOkResponses({
		400: 'Bad request, invalid fields',
	})
	async register(@Body() registerDto: UserPostDTO): Promise<MessageResponseDTO> {
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
	@ApiOperation({ summary: 'Validate a user account and redirect after' })
	@ApiParam({ name: 'user_id', description: 'The user ID' })
	@ApiParam({ name: 'token', description: 'The email verification token' })
	@ApiOkResponse({ description: 'OK', type: MessageResponseDTO })
	@ApiNotOkResponses({
		400: 'Missing ID/token or email already verified',
		401: 'Unauthorized, invalid token',
		404: 'User not found',
	})
	async verifyEmailAndRedirect(@Param('user_id') user_id: number, @Param('token') token: string) {
		validate(z.coerce.number().int().min(1), user_id, this.t.Errors.Id.Invalid(User, user_id));
		validate(z.string().min(12), token, this.t.Errors.JWT.Invalid());

		return this.userService.verifyEmail(user_id, token);
	}
}

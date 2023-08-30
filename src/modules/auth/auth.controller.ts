import { Controller, Post, Body, Param, Get, Res, HttpStatus, BadRequestException } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import express from 'express';

import { TranslateService } from '@modules/translate/translate.service';
import { User } from '@modules/users/entities/user.entity';
import { UsersService } from '@modules/users/users.service';
import { validateObject } from '@utils/validate';

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
		private readonly userService: UsersService,
	) {}

	@Post('login')
	@ApiOperation({ summary: 'Sign in a user with email and password' })
	@ApiUnauthorizedResponse({ description: 'Unauthorized, password invalid' })
	@ApiNotFoundResponse({ description: 'User not found' })
	@ApiOkResponse({ description: 'OK', type: TokenDTO })
	async login(@Body() signInDto: UserSignInDTO): Promise<TokenDTO> {
		validateObject({
			objectToValidate: signInDto,
			objectType: UserPostDTO,
			requiredKeys: ['password', 'email'],
			t: this.t,
		});

		return this.authService.signIn(signInDto.email, signInDto.password);
	}

	@Post('register')
	@ApiOperation({ summary: 'Register a new user' })
	@ApiOkResponse({ description: 'User created', type: User })
	@ApiBadRequestResponse({ description: 'Bad request, invalid fields' })
	async register(@Body() registerDto: UserPostDTO): Promise<User> {
		validateObject({
			objectToValidate: registerDto,
			objectType: UserPostDTO,
			requiredKeys: ['password', 'first_name', 'last_name', 'email', 'birth_date'],
			t: this.t,
		});

		return this.userService.register(registerDto);
	}

	@Get('confirm/:user_id/:token')
	@ApiParam({ name: 'user_id', type: Number })
	@ApiParam({ name: 'token', type: String })
	@ApiOperation({ summary: 'Validate a user account and redirect after' })
	@ApiOkResponse({ description: 'User account validated', type: User })
	@ApiNotFoundResponse({ description: 'User not found' })
	@ApiBadRequestResponse({ description: 'Bad request, missing id/token or email already verified' })
	@ApiUnauthorizedResponse({ description: 'Unauthorized, invalid token' })
	async verifyEmail(@Param('user_id') user_id: number, @Param('token') token: string) {
		if (typeof user_id !== 'number' && parseInt(user_id, 10) != user_id)
			throw new BadRequestException(this.t.Errors.Field.Invalid(Number, 'user_id'));

		if (token.trim() === '') throw new BadRequestException(this.t.Errors.Field.Invalid(String, 'token'));

		return this.userService.verifyEmail(user_id, token);
	}

	@Get('confirm/:user_id/:token/redirect')
	@ApiParam({ name: 'user_id', type: Number })
	@ApiParam({ name: 'token', type: String })
	@ApiOperation({ summary: 'Validate a user account and redirect after' })
	@ApiNotFoundResponse({ description: 'User not found' })
	@ApiBadRequestResponse({ description: 'Bad request, missing id/token or email already verified' })
	@ApiUnauthorizedResponse({ description: 'Unauthorized, invalid token' })
	@ApiResponse({
		status: HttpStatus.PERMANENT_REDIRECT,
		description: 'User account validated, redirecting to ae.utbm.fr',
	})
	async verifyEmailAndRedirect(
		@Res() res: express.Response,
		@Param('user_id') user_id: number,
		@Param('token') token: string,
	) {
		if (typeof user_id !== 'number' && parseInt(user_id, 10) != user_id)
			throw new BadRequestException(this.t.Errors.Field.Invalid(Number, 'user_id'));

		if (token.trim() === '') throw new BadRequestException(this.t.Errors.Field.Invalid(String, 'token'));

		await this.userService.verifyEmail(user_id, token);
		res.redirect(HttpStatus.PERMANENT_REDIRECT, 'https://ae.utbm.fr/');
	}
}

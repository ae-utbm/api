import type { I18nTranslations } from '@types';

import { Controller, Post, Body, Param, Get, Res, HttpStatus } from '@nestjs/common';
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
import { I18nService } from 'nestjs-i18n';

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
		private readonly authService: AuthService,
		private readonly userService: UsersService,
		private readonly i18n: I18nService<I18nTranslations>,
	) {}

	@Post('login')
	@ApiOperation({ summary: 'Sign in a user with email and password' })
	@ApiUnauthorizedResponse({ description: 'Unauthorized, password invalid' })
	@ApiNotFoundResponse({ description: 'User not found' })
	@ApiOkResponse({ description: 'OK', type: TokenDTO })
	async login(@Body() signInDto: UserSignInDTO): Promise<TokenDTO> {
		return this.authService.signIn(signInDto.email, signInDto.password);
	}

	@Post('register')
	@ApiOperation({ summary: 'Register a new user' })
	@ApiOkResponse({ description: 'User created', type: User })
	@ApiBadRequestResponse({ description: 'Bad request, invalid fields' })
	async register(@Body() registerDto: UserPostDTO): Promise<User> {
		validateObject({
			object: registerDto,
			type: UserPostDTO,
			requiredKeys: ['password', 'first_name', 'last_name', 'email', 'birth_date'],
			i18n: this.i18n,
		});

		return this.userService.register(registerDto);
	}

	@Get('confirm/:user_id/:token/:redirect_url?')
	@ApiParam({ name: 'redirect_url', required: false })
	@ApiOperation({ summary: 'Validate a user account' })
	@ApiOkResponse({ description: 'User account validated', type: User })
	@ApiNotFoundResponse({ description: 'User not found' })
	@ApiBadRequestResponse({ description: 'Bad request, missing id/token or email already verified' })
	@ApiUnauthorizedResponse({ description: 'Unauthorized, invalid token' })
	@ApiResponse({
		status: HttpStatus.PERMANENT_REDIRECT,
		description: 'User account validated, redirecting to redirect_url',
	})
	async verifyEmail(
		@Res() res: express.Response,
		@Param('user_id') user_id: number,
		@Param('token') token: string,
		@Param('redirect_url') redirect_url?: string,
	) {
		if (redirect_url && redirect_url !== '') {
			await this.userService.verifyEmail(user_id, token);
			res.redirect(HttpStatus.PERMANENT_REDIRECT, redirect_url.trim());
		}

		res.send(await this.userService.verifyEmail(user_id, token));
	}
}

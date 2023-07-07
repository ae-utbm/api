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

import { UsersService } from '@modules/users/users.service';
import { User } from '@modules/users/entities/user.entity';
import { AuthService } from './auth.service';
import { UserSignInDTO } from './dto/sign-in.dto';
import { UserPostDTO } from './dto/register.dto';
import { TokenDTO } from './dto/token.dto';

import express from 'express';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService, private readonly userService: UsersService) {}

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

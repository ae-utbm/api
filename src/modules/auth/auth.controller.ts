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

import { UsersService } from '@modules/users/users.service';
import { User } from '@modules/users/entities/user.entity';
import { AuthService } from './auth.service';
import { UserSignInDTO } from './dto/sign-in.dto';
import { UserPostDTO } from './dto/register.dto';
import { TokenDTO } from './dto/token.dto';

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
	async verifyEmail(
		@Param('user_id') user_id: number,
		@Param('token') token: string,
		@Param('redirect_url') redirect_url?: string,
	) {
		// TODO : check if redirect_url is a valid url
		if (redirect_url) {
			await this.userService.verifyEmail(user_id, token);
			return { url: redirect_url, code: 301 };
		}

		return this.userService.verifyEmail(user_id, token);
	}
}

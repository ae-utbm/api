import { Controller, Post, Body } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
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
}

import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { ApiNotOkResponses } from '@modules/base/decorators/api-not-ok.decorator';
import { OutputCreatedDTO, OutputMessageDTO } from '@modules/base/dto/output.dto';
import { UsersDataService } from '@modules/users/services/users-data.service';

import { AuthService } from './auth.service';
import { InputEmailParamsDTO, InputRegisterUserDTO, InputSignInDTO } from './dto/input.dto';
import { OutputTokenDTO } from './dto/output.dto';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService, private readonly userService: UsersDataService) {}

	@Post('login')
	@ApiOperation({ summary: 'Sign in a user with email and password' })
	@ApiOkResponse({ description: 'OK', type: OutputTokenDTO })
	@ApiNotOkResponses({
		400: 'Bad Request, invalid fields',
		401: 'Unauthorized, password mismatch',
		403: 'Forbidden, email not verified',
		404: 'User not found',
	})
	async login(@Body() signInDto: InputSignInDTO): Promise<OutputTokenDTO> {
		return this.authService.signIn(signInDto.email, signInDto.password);
	}

	@Post('register')
	@ApiOperation({ summary: 'Register a new user' })
	@ApiOkResponse({ description: 'User created', type: OutputCreatedDTO })
	@ApiNotOkResponses({
		400: 'Bad request, invalid fields',
	})
	async register(@Body() registerDto: InputRegisterUserDTO): Promise<OutputCreatedDTO> {
		return this.userService.register(registerDto);
	}

	@Get('confirm/:user_id/:token')
	@ApiOperation({ summary: 'Validate a user account and redirect after' })
	@ApiParam({ name: 'user_id', description: 'The user ID' })
	@ApiParam({ name: 'token', description: 'The email verification token' })
	@ApiOkResponse({ description: 'OK', type: OutputMessageDTO })
	@ApiNotOkResponses({
		400: 'Missing ID/token or email already verified',
		401: 'Unauthorized, invalid token',
		404: 'User not found',
	})
	async verifyEmailAndRedirect(@Param() params: InputEmailParamsDTO) {
		return this.userService.verifyEmail(params.user_id, params.token);
	}
}

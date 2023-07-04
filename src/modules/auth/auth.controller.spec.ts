import { ConfigService } from '@nestjs/config';
import { MikroORM } from '@mikro-orm/core';
import { JwtService } from '@nestjs/jwt';

import { User } from '@modules/users/entities/user.entity';
import { UsersService } from '@modules/users/users.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserSignInDTO } from './dto/sign-in.dto';
import { TokenDTO } from './dto/token.dto';
import { UserPostDTO } from './dto/register.dto';

import config from 'src/mikro-orm.config';

describe('AuthController', () => {
	let controller: AuthController;
	let authService: AuthService;
	let usersService: UsersService;

	beforeEach(async () => {
		const configService = new ConfigService();
		const mikroOrmService = new MikroORM(config);
		usersService = new UsersService(configService, mikroOrmService);

		authService = new AuthService(usersService, new JwtService());
		controller = new AuthController(authService, usersService);
	});

	describe('login', () => {
		it('should return a token', async () => {
			const signInDto: UserSignInDTO = { email: 'test@example.com', password: 'password' };
			const tokenDto: TokenDTO = { token: 'TOKEN_VALUE', user_id: 1 };

			jest.spyOn(authService, 'signIn').mockResolvedValue(tokenDto);

			const result = await controller.login(signInDto);

			expect(authService.signIn).toHaveBeenCalledWith(signInDto.email, signInDto.password);
			expect(result).toBe(tokenDto);
		});
	});

	describe('register', () => {
		it('should create a new user', async () => {
			const registerDto: UserPostDTO = {
				password: 'root',
				email: 'test@example.com',
				birthday: new Date('2001-01-01'),
				first_name: 'first',
				last_name: 'last',
			};

			jest.spyOn(usersService, 'register').mockResolvedValue(registerDto as User);

			const result = await controller.register(registerDto);

			expect(usersService.register).toHaveBeenCalledWith(registerDto);
			expect(result).toBe(registerDto as User);
		});
	});

	describe('verifyEmail', () => {
		it('should verify user email without redirect URL', async () => {
			const user_id = 1;
			const token = 'TOKEN_VALUE';

			jest.spyOn(usersService, 'verifyEmail').mockResolvedValue(undefined);

			const result = await controller.verifyEmail(user_id, token);

			expect(usersService.verifyEmail).toHaveBeenCalledWith(user_id, token);
			expect(result).toBeUndefined();
		});

		it('should verify user email with redirect URL', async () => {
			const user_id = 1;
			const token = 'TOKEN_VALUE';
			const redirect_url = 'https://example.com';

			jest.spyOn(usersService, 'verifyEmail').mockResolvedValue(undefined);

			const result = await controller.verifyEmail(user_id, token, redirect_url);

			expect(usersService.verifyEmail).toHaveBeenCalledWith(user_id, token);
			expect(result).toEqual({ url: redirect_url, code: 301 });
		});
	});
});

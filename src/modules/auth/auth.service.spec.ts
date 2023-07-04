import { UsersService } from '@modules/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

import { MikroORM } from '@mikro-orm/core';
import { User } from '@modules/users/entities/user.entity';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

import config from 'src/mikro-orm.config';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
	let authService: AuthService;
	let usersService: UsersService;
	let jwtService: JwtService;

	beforeEach(async () => {
		const configService = new ConfigService();
		const mikroOrmService = new MikroORM(config);

		jwtService = new JwtService();
		usersService = new UsersService(configService, mikroOrmService);
		authService = new AuthService(usersService, jwtService);
	});

	describe('signIn', () => {
		const email = 'test@example.com';
		const password = 'password';

		it('should throw NotFoundException when user is not found', async () => {
			jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(null);

			await expect(authService.signIn(email, password)).rejects.toThrowError(NotFoundException);
		});

		it('should throw UnauthorizedException when password does not match', async () => {
			const user = { email, password: 'hashedPassword' };

			jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(user as User);
			jest.spyOn(bcrypt, 'compareSync').mockImplementationOnce(() => false);

			await expect(authService.signIn(email, password)).rejects.toThrowError(UnauthorizedException);
		});

		it('should return token and user_id when email and password match', async () => {
			const user = { id: 1, email, password: 'hashedPassword' };

			jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(user as User);
			jest.spyOn(bcrypt, 'compareSync').mockImplementationOnce(() => true);
			jest.spyOn(jwtService, 'signAsync').mockResolvedValueOnce('token');

			const result = await authService.signIn(email, password);
			expect(result).toEqual({ token: 'token', user_id: 1 });
		});
	});

	describe('validateUser', () => {
		const payload = {
			sub: 1,
			email: 'test@example.com',
			iat: 1,
			exp: 1,
		};
		const user = { email: 'test@example.com', email_verified: true };

		it('should return null when user is not found', async () => {
			jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(null);

			const result = await authService.validateUser(payload);
			expect(result).toBeNull();
		});

		it('should return null when user is not verified', async () => {
			jest.spyOn(usersService, 'findOne').mockResolvedValueOnce({ ...user, email_verified: false } as User);

			const result = await authService.validateUser(payload);
			expect(result).toBeNull();
		});

		it('should return user when user is verified', async () => {
			jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(user as User);

			const result = await authService.validateUser(payload);
			expect(result).toBe(user);
		});
	});
});

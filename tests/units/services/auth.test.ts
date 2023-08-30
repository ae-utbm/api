import { UnauthorizedException } from '@nestjs/common';

import { Errors } from '@i18n';
import { AuthService } from '@modules/auth/auth.service';

import { moduleFixture, jwt, config, i18n } from '../..';

describe('AuthService (unit)', () => {
	let authService: AuthService;

	beforeAll(() => {
		authService = moduleFixture.get<AuthService>(AuthService);
	});

	describe('.verifyJWT()', () => {
		it('should return an error if the token is invalid', () => {
			expect(() => authService.verifyJWT('Bearer invalid')).toThrowError(
				new UnauthorizedException(Errors.JWT.Invalid({ i18n })),
			);
		});

		it('should return an error if the token is expired', () => {
			expect(() =>
				authService.verifyJWT(
					jwt.sign({ id: 1, email: 'test@example.fr' }, { expiresIn: '0s', secret: config.get<string>('auth.jwtKey') }),
				),
			).toThrowError(new UnauthorizedException(Errors.JWT.Expired({ i18n })));
		});
	});
});

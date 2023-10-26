import { UnauthorizedException } from '@nestjs/common';

import { AuthService } from '@modules/auth/auth.service';

import { module_fixture, jwt, config, t } from '../..';

describe('AuthService (unit)', () => {
	let authService: AuthService;

	beforeAll(() => {
		authService = module_fixture.get<AuthService>(AuthService);
	});

	describe('.verifyJWT()', () => {
		it('should return an error if the token is invalid', () => {
			expect(() => authService.verifyJWT('Bearer invalid')).toThrowError(
				new UnauthorizedException(t.Errors.JWT.Invalid()),
			);
		});

		it('should return an error if the token is expired', () => {
			expect(() =>
				authService.verifyJWT(
					jwt.sign({ id: 1, email: 'test@example.fr' }, { expiresIn: '0s', secret: config.get<string>('auth.jwtKey') }),
				),
			).toThrowError(new UnauthorizedException(t.Errors.JWT.Expired()));
		});
	});
});

import { env } from '@env';
import { AuthService } from '@modules/auth/auth.service';
import { i18nUnauthorizedException } from '@modules/base/http-errors';

import { module_fixture, jwt } from '../..';

describe('AuthService (unit)', () => {
	let authService: AuthService;

	beforeAll(() => {
		authService = module_fixture.get<AuthService>(AuthService);
	});

	describe('.verifyJWT()', () => {
		it('should return an error if the token is invalid', () => {
			expect(() => authService.verifyJWT('Bearer invalid')).toThrowError(
				new i18nUnauthorizedException('validations.token.invalid.format', { property: 'token', value: 'invalid' }),
			);
		});

		it('should return an error if the token is expired', () => {
			expect(() =>
				authService.verifyJWT(jwt.sign({ id: 1, email: 'test@example.fr' }, { expiresIn: '0s', secret: env.JWT_KEY })),
			).toThrowError(new i18nUnauthorizedException('validations.token.invalid.expired'));
		});
	});
});

import { UnauthorizedException } from '@nestjs/common';

import { Errors } from '@i18n';
import { verifyJWT } from '@utils/jwt';

import { jwt, config, i18n } from '../..';

describe('.verifyJWT()', () => {
	it('should return an error if the token is invalid', () => {
		expect(() =>
			verifyJWT({
				token: 'Bearer invalid',
				jwtService: jwt,
				configService: config,
				i18nService: i18n,
			}),
		).toThrowError(new UnauthorizedException(Errors.JWT.Invalid({ i18n })));
	});

	it('should return an error if the token is expired', () => {
		expect(() =>
			verifyJWT({
				token: jwt.sign(
					{ id: 1, email: 'test@example.fr' },
					{ expiresIn: '0s', secret: config.get<string>('auth.jwtKey') },
				),
				jwtService: jwt,
				configService: config,
				i18nService: i18n,
			}),
		).toThrowError(new UnauthorizedException(Errors.JWT.Expired({ i18n })));
	});
});

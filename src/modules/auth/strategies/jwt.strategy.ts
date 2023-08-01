import type { I18nTranslations, JWTPayload } from '@types';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { I18nService } from 'nestjs-i18n';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { validateObject } from '@utils/validate';

import { AuthService } from '../auth.service';

/**
 * Strategy used to validate the user from the JWT payload
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private readonly i18n: I18nService<I18nTranslations>,
		private readonly configService: ConfigService,
		private readonly authService: AuthService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: true,
			secretOrKey: configService.get<string>('auth.jwtKey'),
			signOptions: { expiresIn: configService.get<number>('auth.jwtExpirationTime') },
		});
	}

	/**
	 * Validate the user from the payload
	 * @param payload - The payload from the JWT
	 */
	async validate(payload: JWTPayload) {
		validateObject({
			object: payload,
			type: 'JWTPayload',
			requiredKeys: ['sub', 'email', 'iat', 'exp'],
			i18n: this.i18n,
		});

		// Find the user from the payload
		// > If the user is not found, throw an error (Not found)
		// > If the user is not verified, throw an error (Unauthorized)
		return this.authService.validateUser(payload);
	}
}

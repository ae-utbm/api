import type { I18nTranslations, JWTPayload } from '@types';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';

import { authInvalidPayload } from '@utils/responses';
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
			ignoreExpiration: false,
			secretOrKey: configService.get<string>('auth.jwtKey'),
			signOptions: { expiresIn: configService.get<number>('auth.jwtExpirationTime') },
		});
	}

	/**
	 * Validate the user from the payload
	 * @param payload - The payload from the JWT
	 */
	async validate(payload: JWTPayload) {
		const user = await this.authService.validateUser(payload);

		if (!user) throw new UnauthorizedException(authInvalidPayload({ i18n: this.i18n }));
		return user;
	}
}

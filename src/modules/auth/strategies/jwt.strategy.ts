import type { JWTPayload } from '@types';

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

/**
 * Strategy used to validate the user from the JWT payload
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(configService: ConfigService, private authService: AuthService) {
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

		if (!user) throw new UnauthorizedException();
		return user;
	}
}

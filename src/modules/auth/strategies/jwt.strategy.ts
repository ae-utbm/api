import type { JWTPayload } from '#types/api';

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { z } from 'zod';

import { env } from '@env';

import { AuthService } from '../auth.service';

/**
 * Strategy used to validate the user from the JWT payload
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly authService: AuthService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: true,
			secretOrKey: env.JWT_KEY,
			signOptions: { expiresIn: env.JWT_EXPIRATION_TIME },
		});
	}

	/**
	 * Validate the user from the payload
	 * @param payload - The payload from the JWT
	 */
	async validate(payload: JWTPayload) {
		z.object({
			sub: z.number().int().min(1),
			email: z.string().email(),
			iat: z.number().int().min(0),
			exp: z.number().int().min(0),
		})
			.strict()
			.parse(payload);

		// Find the user from the payload
		// > If the user is not found, throw an error (Not found)
		// > If the user is not verified, throw an error (Unauthorized)
		return this.authService.validateUser(payload);
	}
}

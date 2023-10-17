import type { JWTPayload } from '#types/api';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { z } from 'zod';

import { validate } from '@utils/validate';

import { AuthService } from '../auth.service';

/**
 * Strategy used to validate the user from the JWT payload
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly configService: ConfigService, private readonly authService: AuthService) {
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
		const schema = z
			.object({
				sub: z.number().int().min(1),
				email: z.string().email(),
				iat: z.number().int().min(0),
				exp: z.number().int().min(0),
			})
			.strict();

		validate(schema, payload);

		// Find the user from the payload
		// > If the user is not found, throw an error (Not found)
		// > If the user is not verified, throw an error (Unauthorized)
		return this.authService.validateUser(payload);
	}
}

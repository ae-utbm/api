import type { email as Email } from '#types';
import type { JWTPayload } from '#types/api';

import { CreateRequestContext, MikroORM } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compareSync } from 'bcrypt';

import { env } from '@env';
import { i18nForbiddenException, i18nNotFoundException, i18nUnauthorizedException } from '@modules/_mixin/http-errors';
import { User } from '@modules/users/entities/user.entity';

import { OutputTokenDTO } from './dto/output.dto';

@Injectable()
export class AuthService {
	constructor(private readonly orm: MikroORM, private readonly jwtService: JwtService) {}

	/**
	 * Sign in a user and return a JWT token and the user ID
	 * @param {Email} email the user email
	 * @param {string} pass the user password (hashed or not) @default false
	 * @returns {Promise<OutputTokenDTO>} The JWT token and the user ID
	 */
	@CreateRequestContext()
	async signIn(email: Email, pass: string): Promise<OutputTokenDTO> {
		const user: User = await this.orm.em.findOne(User, { email }, { fields: ['*', 'password'] });
		if (!user) throw new i18nNotFoundException('validations.user.not_found.email', { email });

		if (user.password !== pass && !compareSync(pass, user.password))
			throw new i18nUnauthorizedException('validations.password.invalid.mismatch');

		if (!user.verified) throw new i18nForbiddenException('validations.user.unverified');

		const payload = { sub: user.id, email: user.email };
		return {
			token: this.jwtService.sign(payload),
			user_id: user.id,
		};
	}

	/**
	 * Validate the user from the payload
	 * @param {JWTPayload} payload JWT Payload to validate
	 * @returns {User} The user if found and valid, throw otherwise (account not verified)
	 */
	@CreateRequestContext()
	async validateUser(payload: JWTPayload): Promise<User> {
		const user = await this.orm.em.findOne(User, { id: payload.sub });

		// throw if user not verified
		// -> should not happen as the JWT is provided by this.signIn method
		/* istanbul ignore next-line */
		if (!user.verified) throw new i18nForbiddenException('validations.user.unverified');
		return user;
	}

	/**
	 * Verify the JWT token and return the payload if valid
	 * @param {string} token token to verify
	 * @returns {JWTPayload} The payload if valid
	 *
	 * @throws {i18nUnauthorizedException} If the token is invalid or expired
	 */
	verifyJWT(token: string): JWTPayload | never {
		const bearer = token.replace('Bearer', '').trim();

		try {
			return this.jwtService.verify<JWTPayload>(bearer, { secret: env.JWT_KEY });
		} catch (err) {
			const error = err as Error;
			if (error.name === 'TokenExpiredError') throw new i18nUnauthorizedException('validations.token.invalid.expired');
			if (error.name === 'JsonWebTokenError') throw new i18nUnauthorizedException('validations.token.invalid.format');

			/* istanbul ignore next-line */
			throw new i18nUnauthorizedException('validations.token.invalid.unknown');
		}
	}
}

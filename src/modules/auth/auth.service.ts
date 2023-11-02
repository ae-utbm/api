import type { email as Email } from '#types';
import type { JWTPayload } from '#types/api';

import { CreateRequestContext, MikroORM } from '@mikro-orm/core';
import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compareSync } from 'bcrypt';

import { env } from '@env';
import { TranslateService } from '@modules/translate/translate.service';
import { User } from '@modules/users/entities/user.entity';

import { TokenDTO } from './dto/get.dto';

@Injectable()
export class AuthService {
	constructor(
		private readonly t: TranslateService,
		private readonly orm: MikroORM,
		private readonly jwtService: JwtService,
	) {}

	/**
	 * Sign in a user and return a JWT token and the user ID
	 * @param {Email} email the user email
	 * @param {string} pass the user password (hashed or not) @default false
	 * @returns {Promise<TokenDTO>} The JWT token and the user ID
	 */
	@CreateRequestContext()
	async signIn(email: Email, pass: string): Promise<TokenDTO> {
		const user: User = await this.orm.em.findOne(User, { email }, { fields: ['*', 'password'] });

		if (!user) throw new NotFoundException(this.t.Errors.Email.NotFound(User, email));

		if (user.password !== pass && !compareSync(pass, user.password)) {
			throw new UnauthorizedException(this.t.Errors.Password.Mismatch());
		}

		if (!user.verified) {
			throw new ForbiddenException(this.t.Errors.Email.NotVerified(User));
		}

		const payload = { sub: user.id, email: user.email };
		return {
			token: this.jwtService.sign(payload),
			user_id: user.id,
		};
	}

	/**
	 * Validate the user from the payload
	 * @param {JWTPayload} payload JWT Payload to validate
	 * @returns {User} The user if found and valid, throw otherwise (email not verified)
	 */
	@CreateRequestContext()
	async validateUser(payload: JWTPayload): Promise<User> {
		const user = await this.orm.em.findOne(User, { id: payload.sub });

		// throw if user not verified
		if (!user.email_verified) throw new UnauthorizedException(this.t.Errors.Email.NotVerified(User));

		return user;
	}

	/**
	 * Verify the JWT token and return the payload if valid
	 * @param {string} token token to verify
	 * @returns {JWTPayload} The payload if valid
	 *
	 * @throws {UnauthorizedException} If the token is invalid or expired
	 */
	verifyJWT(token: string): JWTPayload | never {
		const bearer = token.replace('Bearer', '').trim();

		try {
			return this.jwtService.verify<JWTPayload>(bearer, { secret: env.JWT_KEY });
		} catch (err) {
			const error = err as Error;
			if (error.name === 'TokenExpiredError') throw new UnauthorizedException(this.t.Errors.JWT.Expired());
			if (error.name === 'JsonWebTokenError') throw new UnauthorizedException(this.t.Errors.JWT.Invalid());

			/* istanbul ignore next-line */
			throw new UnauthorizedException(this.t.Errors.JWT.Unknown());
		}
	}
}

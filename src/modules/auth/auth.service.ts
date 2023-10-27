import type { email } from '#types';
import type { JWTPayload } from '#types/api';

import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compareSync } from 'bcrypt';

import { env } from '@env';
import { TranslateService } from '@modules/translate/translate.service';
import { User } from '@modules/users/entities/user.entity';
import { UsersDataService } from '@modules/users/services/users-data.service';

import { TokenDTO } from './dto/token.dto';

@Injectable()
export class AuthService {
	constructor(
		private readonly t: TranslateService,
		private readonly jwtService: JwtService,
		private readonly usersService: UsersDataService,
	) {}

	/**
	 * Sign in a user and return a JWT token and the user ID
	 * @param {email} email the user email
	 * @param {string} pass the user password (hashed or not) @default false
	 * @returns {Promise<TokenDTO>} The JWT token and the user ID
	 */
	async signIn(email: email, pass: string): Promise<TokenDTO> {
		const user: User = await this.usersService.findOne(email, false);

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
	async validateUser(payload: JWTPayload): Promise<User> {
		const user = await this.usersService.findOne(payload.email, false);

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

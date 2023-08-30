import type { JWTPayload, email } from '@types';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compareSync } from 'bcrypt';

import { TranslateService } from '@modules/translate/translate.service';
import { User } from '@modules/users/entities/user.entity';
import { UsersService } from '@modules/users/users.service';

import { TokenDTO } from './dto/token.dto';

@Injectable()
export class AuthService {
	constructor(
		private readonly t: TranslateService,
		private readonly jwtService: JwtService,
		private readonly usersService: UsersService,
		private readonly configService: ConfigService,
	) {}

	async signIn(email: email, pass: string): Promise<TokenDTO> {
		const user: User = await this.usersService.findOne({ email: email }, false);

		if (user.password !== pass && !compareSync(pass, user.password)) {
			throw new UnauthorizedException(this.t.Errors.Password.Mismatch());
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
		const user = await this.usersService.findOne({ email: payload.email }, false);

		// throw if user not verified
		if (!user.email_verified) throw new UnauthorizedException(this.t.Errors.Email.NotVerified(User));

		return user;
	}

	verifyJWT(token: string): JWTPayload | never {
		const bearer = token.replace('Bearer', '').trim();

		try {
			return this.jwtService.verify<JWTPayload>(bearer, { secret: this.configService.get<string>('auth.jwtKey') });
		} catch (err) {
			const error = err as Error;
			if (error.name === 'TokenExpiredError') throw new UnauthorizedException(this.t.Errors.JWT.Expired());
			if (error.name === 'JsonWebTokenError') throw new UnauthorizedException(this.t.Errors.JWT.Invalid());

			/* istanbul ignore next-line */
			throw new UnauthorizedException(this.t.Errors.JWT.Unknown());
		}
	}
}

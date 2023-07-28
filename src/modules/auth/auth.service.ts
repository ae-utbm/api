import type { JWTPayload, Email, I18nTranslations } from '@types';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compareSync } from 'bcrypt';
import { I18nService } from 'nestjs-i18n';

import { User } from '@modules/users/entities/user.entity';
import { UsersService } from '@modules/users/users.service';
import { emailNotVerified, passwordMismatch } from '@utils/responses';

import { TokenDTO } from './dto/token.dto';

@Injectable()
export class AuthService {
	constructor(
		private readonly i18n: I18nService<I18nTranslations>,
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
	) {}

	async signIn(email: Email, pass: string): Promise<TokenDTO> {
		const user: User = await this.usersService.findOne({ email: email }, false);

		if (user.password !== pass && !compareSync(pass, user.password)) {
			throw new UnauthorizedException(passwordMismatch({ i18n: this.i18n }));
		}

		const payload = { sub: user.id, email: user.email };
		return {
			token: await this.jwtService.signAsync(payload),
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
		if (!user.email_verified) throw new UnauthorizedException(emailNotVerified({ i18n: this.i18n, type: User }));
		return user;
	}
}

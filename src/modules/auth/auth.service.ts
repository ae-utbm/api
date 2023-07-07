import type { JWTPayload, Email } from '@types';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@modules/users/users.service';
import { User } from '@modules/users/entities/user.entity';

import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
	constructor(private usersService: UsersService, private jwtService: JwtService) {}

	async signIn(email: Email, pass: string) {
		const user: User = await this.usersService.findOne({ email: email }, false);

		if (user.password !== pass && !bcrypt.compareSync(pass, user.password)) {
			throw new UnauthorizedException('Password mismatch');
		}

		const payload = { sub: user.id, email: user.email };
		return {
			token: await this.jwtService.signAsync(payload),
			user_id: user.id,
		};
	}

	async validateUser(payload: JWTPayload): Promise<User | null> {
		// Get the user from the database
		const user = await this.usersService.findOne({ email: payload.email }, false);

		// Do not validate if user isn't verified
		//              or if user doesn't exists
		if (!user || !user.email_verified) return null;
		return user;
	}
}

import type { JWTPayload } from '@types';

import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@modules/users/users.service';
import { User } from '@modules/users/entities/user.entity';

import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
	constructor(private usersService: UsersService, private jwtService: JwtService) {}

	async signIn(email: string, pass: string) {
		let user: User;
		try {
			user = await this.usersService.findOne({ email: email }, false);
		} catch {
			throw new NotFoundException('User not found');
		}

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

		// If user doesn't exists, return null
		return user ?? null;
	}
}

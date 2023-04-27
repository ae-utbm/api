import { UseRequestContext, MikroORM } from '@mikro-orm/core';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenExpiredError } from 'jsonwebtoken';
import { RefreshToken } from './entities/refresh-token.entity';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
	constructor(private usersService: UsersService, private jwtService: JwtService, private readonly orm: MikroORM) {}

	@UseRequestContext()
	async validateUser(email: string, pass: string): Promise<null | Omit<User, 'password'>> {
		const user = await this.usersService.findOne({ email });
		if (!user) return null;

		const { password, ...result } = user;
		const match = await bcrypt.compare(pass, password);

		if (match) return result;
		return null;
	}

	@UseRequestContext()
	async generateAccessToken(user: Pick<User, 'id'>) {
		const payload = { sub: String(user.id) };
		return this.jwtService.signAsync(payload);
	}

	@UseRequestContext()
	async createRefreshToken(user: Pick<User, 'id'>, expiresIn: number) {
		const expires = new Date();
		expires.setTime(expires.getTime() + expiresIn);

		const token = this.orm.em.create(RefreshToken, { user, expires });
		await this.orm.em.persistAndFlush(token);

		return token;
	}

	@UseRequestContext()
	async generateRefreshToken(user: Pick<User, 'id'>, expiresIn: number) {
		const payload = { sub: String(user.id) };
		const token = await this.createRefreshToken(user, expiresIn);
		return await this.jwtService.signAsync({
			...payload,
			expiresIn,
			jwtId: String(token.id),
		});
	}

	@UseRequestContext()
	async resolveRefreshToken(encoded: string) {
		try {
			const payload = await this.jwtService.verify(encoded);
			if (!payload.sub || !payload.jwtId) throw new UnprocessableEntityException('Refresh token malformed');

			const token = await this.orm.em.findOne(RefreshToken, { id: payload.jwtId });
			if (!token) throw new UnprocessableEntityException('Refresh token not found');
			if (token.revoked) throw new UnprocessableEntityException('Refresh token revoked');

			const user = await this.usersService.findOne({ id: payload.subject });
			if (!user) throw new UnprocessableEntityException('Refresh token malformed');

			return { user, token };
		} catch (e) {
			if (e instanceof TokenExpiredError) throw new UnprocessableEntityException('Refresh token expired');
			else throw new UnprocessableEntityException('Refresh token malformed');
		}
	}

	@UseRequestContext()
	async createAccessTokenFromRefreshToken(refresh: string) {
		const { user } = await this.resolveRefreshToken(refresh);
		const token = await this.generateAccessToken(user);

		return { user, token };
	}

	@UseRequestContext()
	async register(email: string, pass: string) {
		if (await this.usersService.findOne({ email })) return null;

		const hashed = await bcrypt.hash(pass, 10);
		return await this.usersService.create({ email, password: hashed });
	}
}

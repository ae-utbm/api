import { UseRequestContext, MikroORM } from '@mikro-orm/core';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenExpiredError } from 'jsonwebtoken';
import { RefreshToken } from './entities/refresh-token.entity';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
	constructor(
		private usersService: UsersService,
		private jwtService: JwtService,
		private configService: ConfigService,
		private readonly orm: MikroORM,
	) {}

	/**
	 * Checks if the user's credentials are valid.
	 * @param {User['email']} email the user's main email address
	 * @param {User['password']} pass  the user's password
	 * @returns {Promise<null | Omit<User, 'password'>>} a promise with the user's data (without the
	 * password) if the credentials are valid, null otherwise
	 */
	async validateUser(email: User['email'], pass: User['password']): Promise<null | Omit<User, 'password'>> {
		const user = await this.usersService.findOne({ email });
		if (!user) return null;

		const { password, ...result } = user;
		const match = await bcrypt.compare(pass, password);

		return match ? result : null;
	}

	/**
	 * Generates an access token for the user with the given id.
	 * @param {User['id']} id the user's id
	 * @param {number} expiresIn the time in seconds for the token to expire
	 * @returns {Promise<string>} a promise with the access token
	 */
	async generateAccessToken(id: User['id'], expiresIn: number): Promise<string> {
		const payload = { subject: String(id), expiresIn };
		return this.jwtService.signAsync(payload);
	}

	/**
	 * Creates a refresh token in the database for the user with the given id.
	 * @param {User['id']} id the user's id
	 * @param {number} expiresIn the time in seconds for the token to expire
	 * @returns {Promise<RefreshToken>} a promise with the refresh token
	 */
	@UseRequestContext()
	async createRefreshToken(id: User['id'], expiresIn: number): Promise<RefreshToken> {
		const expires = new Date();
		expires.setTime(expires.getTime() + expiresIn);

		const token = this.orm.em.create(RefreshToken, { expires, user: id }, { managed: true });
		await this.orm.em.persistAndFlush(token);

		return token;
	}

	/**
	 * Generate a refresh token based on its id in the database.
	 * @param {User['id']} id user's id to whom the token belongs
	 * @param {number} expiresIn the time in seconds for the token to expire
	 * @returns {Promise<string>} a promise with the refresh token
	 */
	async generateRefreshToken(id: User['id'], expiresIn: number): Promise<string> {
		const payload = { subject: String(id) };
		const token = await this.createRefreshToken(id, expiresIn);
		return await this.jwtService.signAsync({
			...payload,
			expiresIn,
			jwtId: String(token.id),
		});
	}

	/**
	 * Resolves a refresh token from the database.
	 * @param {string} encoded the supposed encoded refresh token
	 * @returns {Promise<RefreshToken>} a promise with the 'decoded' refresh token (if it exists in the database and it's valid)
	 */
	@UseRequestContext()
	async resolveRefreshToken(encoded: string): Promise<RefreshToken> {
		try {
			// decode token
			const payload = await this.jwtService.verify(encoded);
			if (!payload.subject || !payload.jwtId) throw new UnprocessableEntityException('Refresh token malformed');

			// get token from database
			const refreshToken = await this.orm.em.findOne(RefreshToken, { id: payload.jwtId });
			if (!refreshToken) throw new UnprocessableEntityException('Refresh token not found');
			if (refreshToken.revoked) throw new UnprocessableEntityException('Refresh token revoked');

			// get user from database
			const user = await this.usersService.findOne({ id: payload.subject });
			if (!user) throw new UnprocessableEntityException('Refresh token malformed');

			// revoke token if it's expired
			const date = new Date();
			if (date.getTime() >= refreshToken.expires.getTime()) {
				refreshToken.revoked = true;
				await this.orm.em.persistAndFlush(refreshToken);
			}

			return refreshToken;
		} catch (e) {
			if (e instanceof TokenExpiredError) throw new UnprocessableEntityException('Refresh token expired');
			else throw new UnprocessableEntityException('Refresh token malformed');
		}
	}

	/**
	 * Creates a new access token from the given refresh token.
	 * @param {string} refresh the supposed encoded refresh token
	 * @returns {Promise<{ accessToken: string; refreshToken: string }>} a promise with the new access token and the refresh token (a new one if the old one was revoked)
	 */
	async createAccessTokenFromRefreshToken(refresh: string): Promise<{ accessToken: string; refreshToken: string }> {
		const currRefresh = await this.resolveRefreshToken(refresh);
		const accessToken = await this.generateAccessToken(
			currRefresh.user.id,
			this.configService.get<number>('auth.jwtRefreshExpirationTime'),
		);

		if (!currRefresh.revoked) return { accessToken, refreshToken: refresh };
		else
			return {
				accessToken,
				refreshToken: await this.generateRefreshToken(
					currRefresh.user.id,
					this.configService.get<number>('auth.jwtAccessExpirationTime'),
				),
			};
	}

	/**
	 * Registers a new user in the database.
	 * @param {Partial<User> & Required<Pick<User, 'password' | 'email'>>} input the user's data with at least the password and email
	 * @returns {Promise<Omit<User, 'password'>>} a promise with the created user
	 */
	async register(input: Partial<User> & Required<Pick<User, 'password' | 'email'>>): Promise<Omit<User, 'password'>> {
		if (await this.usersService.findOne({ email: input.email })) return null;

		const hashed = await bcrypt.hash(input.password, 10);
		return await this.usersService.create({ ...input, password: hashed });
	}
}

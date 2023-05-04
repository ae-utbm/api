import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

import * as bcrypt from 'bcrypt';
import { UserObject } from '../users/models/user.object';
import { UserRegisterArgs } from '@modules/users/models/user-register.args';

@Injectable()
export class AuthService {
	constructor(private usersService: UsersService, private jwtService: JwtService) {}

	/**
	 * Checks if the user's credentials are valid.
	 * @param {User['email']} email the user's main email address
	 * @param {User['password']} pass  the user's password
	 * @returns {Promise<null | UserObject>} a promise with the user's data (without the
	 * password) if the credentials are valid, null otherwise
	 */
	async validateUser(email: User['email'], pass: User['password']): Promise<null | UserObject> {
		const user = await this.usersService.findOne({ email }, false);
		if (!user) return null;

		const match = await bcrypt.compare(pass, user.password);
		return match ? this.usersService.convertToUserObject(user) : null;
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
	 * Registers a new user in the database.
	 * @param {Partial<User> & Required<Pick<User, 'password' | 'email'>>} input the user's data with at least the password and email
	 * @returns {Promise<Omit<User, 'password'>>} a promise with the created user
	 */
	async register(input: UserRegisterArgs): Promise<Omit<User, 'password'>> {
		if (await this.usersService.findOne({ email: input.email })) return null;

		const hashed = await bcrypt.hash(input.password, 10);
		return await this.usersService.create({ ...input, password: hashed });
	}
}

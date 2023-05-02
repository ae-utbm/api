import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { User } from 'src/modules/users/entities/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
	constructor(private authService: AuthService) {
		super();
	}

	/**
	 * Validate the user with the given username and password
	 * @param {string} username - The username of the user
	 * @param {string} password - The password of the user
	 * @returns {Promise<Omit<User, 'password'>>} - The user, if found with its password omitted
	 */
	async validate(username: string, password: string): Promise<Omit<User, 'password'>> {
		const user = await this.authService.validateUser(username, password);
		if (!user) throw new UnauthorizedException();
		return user;
	}
}

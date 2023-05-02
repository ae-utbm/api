import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/modules/users/users.service';
import { User } from 'src/modules/users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(configService: ConfigService, private usersService: UsersService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: configService.get('auth.jwtKey'),
			signOptions: { expiresIn: configService.get('auth.jwtExpirationTime') },
		});
	}

	/**
	 * Validate the user from the payload
	 * @param payload - The payload from the JWT
	 * @returns {Promise<User>} - the user, if found
	 */
	async validate(payload: { sub: number }): Promise<User> {
		const { sub: id } = payload;
		return await this.usersService.findOne({ id });
	}
}

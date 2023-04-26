import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/modules/users/users.service';

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

	async validate(payload: { sub: number }) {
		const { sub: id } = payload;
		return await this.usersService.findOne({ id });
	}
}

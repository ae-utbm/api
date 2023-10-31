import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { env } from '@env';
import { TranslateService } from '@modules/translate/translate.service';
import { UsersModule } from '@modules/users/users.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
	imports: [
		PassportModule,
		JwtModule.registerAsync({
			useFactory: () => ({
				secret: env.JWT_KEY,
				signOptions: { expiresIn: env.JWT_EXPIRATION_TIME },
			}),
		}),
		UsersModule,
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy, TranslateService],
	exports: [AuthService],
})
export class AuthModule {}

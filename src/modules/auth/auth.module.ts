import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';

@Module({
	imports: [
		PassportModule,
		JwtModule.registerAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => ({
				secret: configService.get<string>('auth.jwtKey'),
				signOptions: { expiresIn: configService.get('auth.jwtExpirationTime') },
			}),
			inject: [ConfigService],
		}),
		UsersModule,
	],
	providers: [AuthService, AuthResolver, JwtStrategy],
})
export class AuthModule {}

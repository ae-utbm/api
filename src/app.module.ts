import env from './env';
import config from './mikro-orm.config';
import path from 'path';

import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from '@modules/logs/interceptor/logging.interceptor';

import { AuthModule } from '@modules/auth/auth.module';
import { LogsModule } from '@modules/logs/logs.module';
import { PermissionsModule } from '@modules/permissions/permissions.module';
import { PromotionsModule } from '@modules/promotions/promotions.module';
import { RolesModule } from '@modules/roles/roles.module';
import { UsersModule } from '@modules/users/users.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [env],
		}),
		MikroOrmModule.forRoot({
			...config,
			// Entities paths are relative to the root of the project so we need to update them
			entities: [path.join(__dirname, '/modules/**/*.entity.js')],
			entitiesTs: [path.join(__dirname, '/modules/src/**/*.entity.ts')],
		}),
		AuthModule,
		LogsModule,
		PermissionsModule,
		PromotionsModule,
		RolesModule,
		UsersModule,
	],
	providers: [
		{
			provide: APP_INTERCEPTOR,
			useClass: LoggingInterceptor,
		},
	],
})
export class AppModule {}

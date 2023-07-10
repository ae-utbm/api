import { join } from 'path';

import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';

import { AuthModule } from '@modules/auth/auth.module';
import { LoggingInterceptor } from '@modules/logs/interceptor/logging.interceptor';
import { LogsModule } from '@modules/logs/logs.module';
import { PermissionsModule } from '@modules/permissions/permissions.module';
import { PromotionsModule } from '@modules/promotions/promotions.module';
import { RolesModule } from '@modules/roles/roles.module';
import { UsersModule } from '@modules/users/users.module';

import env from './env';
import config from './mikro-orm.config';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [env],
		}),
		ScheduleModule.forRoot(),
		MikroOrmModule.forRoot({
			...config,
			// Entities paths are relative to the root of the project so we need to update them
			entities: [join(__dirname, '../../dist/src/modules/**/*.entity.js')],
			entitiesTs: [join(__dirname, '/modules/**/*.entity.ts')],
		}),
		I18nModule.forRoot({
			fallbackLanguage: 'en-US',
			loaderOptions: {
				path: join(__dirname, '/i18n/'),
				watch: true,
			},
			resolvers: [AcceptLanguageResolver],
			typesOutputPath: join(__dirname, '../../src/types/api/i18n.d.ts'),
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

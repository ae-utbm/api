import { join, sep } from 'path';

import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';

import { AuthModule } from '@modules/auth/auth.module';
import { EmailsModule } from '@modules/emails/emails.module';
import { FilesModule } from '@modules/files/files.module';
import { LoggingInterceptor } from '@modules/logs/interceptor/logging.interceptor';
import { LogsModule } from '@modules/logs/logs.module';
import { PermissionsModule } from '@modules/permissions/permissions.module';
import { PromotionsModule } from '@modules/promotions/promotions.module';
import { RolesModule } from '@modules/roles/roles.module';
import { TranslateModule } from '@modules/translate/translate.module';
import { UsersModule } from '@modules/users/users.module';

import env from './env';

@Module({
	imports: [
		AuthModule,
		ConfigModule.forRoot({
			isGlobal: true,
			load: [env],
		}),
		EmailsModule,
		FilesModule,
		I18nModule.forRoot({
			fallbackLanguage: 'en-US',
			loaderOptions: {
				path: join(__dirname, '/i18n/'),
				watch: true,
			},
			resolvers: [AcceptLanguageResolver],
			typesOutputPath: join(__dirname, '../src/types/api/i18n.d.ts').replace(`${sep}dist`, ''),
		}),
		LogsModule,
		MikroOrmModule.forRoot(),
		PermissionsModule,
		PromotionsModule,
		RolesModule,
		ScheduleModule.forRoot(),
		TranslateModule,
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

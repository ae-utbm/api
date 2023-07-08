import type { I18nTranslations } from '@types';

import 'tsconfig-paths/register';
import path from 'path';

import { MikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { NestExpressApplication } from '@nestjs/platform-express';
import { TestingModule, Test } from '@nestjs/testing';
import { AcceptLanguageResolver, I18nModule, I18nService } from 'nestjs-i18n';

import { AppModule } from '@app.module';
import env from '@env';
import config from '@mikro-orm.config';

let i18n: I18nService<I18nTranslations>;
let app: NestExpressApplication;
let orm: MikroORM;

/**
 * This file is used to setup the ORM & the NestJS application before running each suite of tests.
 * > A suite is made of all the tests in the same file.
 */

// So this runs before all tests of the suite
beforeAll(async () => {
	const moduleFixture: TestingModule = await Test.createTestingModule({
		imports: [
			AppModule,
			MikroOrmModule.forRoot({
				...config,
				// Entities paths are relative to the root of the project so we need to update them
				entities: [path.join(__dirname, '../../dist/src/modules/**/*.entity.js')],
				entitiesTs: [path.join(__dirname, '../src/modules/**/*.entity.ts')],
			}),
			I18nModule.forRoot({
				fallbackLanguage: 'en-US',
				loaderOptions: {
					path: path.join(__dirname, '../src/i18n/'),
					watch: true,
				},
				resolvers: [AcceptLanguageResolver],
			}),
		],
	}).compile();

	app = moduleFixture.createNestApplication();
	app.setGlobalPrefix('api');
	app.enableCors({ origin: env().cors });
	app.useStaticAssets(env().files.baseDir, { index: false, prefix: '/public' });

	orm = moduleFixture.get<MikroORM>(MikroORM);
	i18n = moduleFixture.get<I18nService<I18nTranslations>>(I18nService);

	await app.init();

	expect(app).toBeDefined();
	expect(orm).toBeDefined();
	expect(i18n).toBeDefined();
});

// And this runs after all tests of the suite
afterAll(async () => {
	await orm.close(true);
	await app.close();
});

export { app, orm, i18n };

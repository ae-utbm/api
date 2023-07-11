import type { I18nTranslations } from '@types';

import 'tsconfig-paths/register';

import { MikroORM } from '@mikro-orm/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { TestingModule, Test } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';

import { AppModule } from '@app.module';
import env from '@env';

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
		imports: [AppModule],
	}).compile();

	app = moduleFixture.createNestApplication();
	app.setGlobalPrefix('api');
	app.enableCors({ origin: env().cors });
	app.useStaticAssets(env().files.baseDir, { index: false, prefix: '/public' });

	orm = moduleFixture.get<MikroORM>(MikroORM);
	i18n = moduleFixture.get<I18nService<I18nTranslations>>(I18nService);

	await app.init();
});

// And this runs after all tests of the suite
afterAll(async () => {
	await orm.close(true);
	await app.close();
});

export { app, orm, i18n };

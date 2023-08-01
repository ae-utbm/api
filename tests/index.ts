/* istanbul ignore file */

import type { I18nTranslations } from '@types';

import 'tsconfig-paths/register';
import '@utils/index';

import { MikroORM } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NestExpressApplication } from '@nestjs/platform-express';
import { TestingModule, Test } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';

import { AppModule } from '@app.module';
import env from '@env';

let moduleFixture: TestingModule;
let config: ConfigService;
let i18n: I18nService<I18nTranslations>;
let jwt: JwtService;
let app: NestExpressApplication;
let orm: MikroORM;

/**
 * This file is used to setup the ORM & the NestJS application before running each suite of tests.
 * > A suite is made of all the tests in the same file.
 */

// So this runs before all tests of the suite
beforeAll(async () => {
	moduleFixture = await Test.createTestingModule({
		imports: [AppModule],
	}).compile();

	app = moduleFixture.createNestApplication();
	app.setGlobalPrefix('api');
	app.enableCors({ origin: env().cors });
	app.useStaticAssets(env().files.baseDir, { index: false, prefix: '/public' });

	orm = moduleFixture.get<MikroORM>(MikroORM);
	i18n = moduleFixture.get<I18nService<I18nTranslations>>(I18nService);
	config = moduleFixture.get<ConfigService>(ConfigService);
	jwt = moduleFixture.get<JwtService>(JwtService);

	orm.config.set('allowGlobalContext', true);

	await app.init();
});

// And this runs after all tests of the suite
afterAll(async () => {
	await orm.close(true);
	await app.close();
});

export { moduleFixture, config, app, orm, i18n, jwt };

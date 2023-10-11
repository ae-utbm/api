/* istanbul ignore file */

import 'tsconfig-paths/register';
import '@exported/global/utils';

import { MikroORM } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NestExpressApplication } from '@nestjs/platform-express';
import { TestingModule, Test } from '@nestjs/testing';

import { AppModule } from '@app.module';
import env from '@env';
import { TranslateService } from '@modules/translate/translate.service';

let moduleFixture: TestingModule;
let config: ConfigService;
let jwt: JwtService;
let app: NestExpressApplication;
let t: TranslateService;

/** Should be forked using om.em.fork() for each test suite */
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
	app.enableCors({ origin: env().cors });
	app.useStaticAssets(env().files.baseDir, { index: false, prefix: '/public' });

	orm = moduleFixture.get<MikroORM>(MikroORM);
	t = moduleFixture.get<TranslateService>(TranslateService);
	config = moduleFixture.get<ConfigService>(ConfigService);
	jwt = moduleFixture.get<JwtService>(JwtService);

	await app.init();
});

// And this runs after all tests of the suite
afterAll(async () => {
	await orm.close(true);
	await app.close();
});

export { moduleFixture, config, app, orm, t, jwt };

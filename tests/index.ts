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

let module_fixture: TestingModule;
let config: ConfigService;
let jwt: JwtService;
let app: NestExpressApplication;
let server: Awaited<ReturnType<NestExpressApplication['listen']>>;
let t: TranslateService;

/** Should be forked using om.em.fork() for each test suite */
let orm: MikroORM;

/**
 * This file is used to setup the ORM & the NestJS application before running each suite of tests.
 * > A suite is made of all the tests in the same file.
 */

// So this runs before all tests of the suite
beforeAll(async () => {
	module_fixture = await Test.createTestingModule({
		imports: [AppModule],
	}).compile();

	app = module_fixture.createNestApplication();
	app.enableCors({ origin: env().cors });
	app.useStaticAssets(env().files.baseDir, { index: false, prefix: '/public' });

	orm = module_fixture.get<MikroORM>(MikroORM);
	t = module_fixture.get<TranslateService>(TranslateService);
	config = module_fixture.get<ConfigService>(ConfigService);
	jwt = module_fixture.get<JwtService>(JwtService);

	server = await app.listen(5325);
	await app.init();
});

// And this runs after all tests of the suite
afterAll(async () => {
	await orm.close(true);
	await app.close();
	server.close();
});

export { module_fixture, config, server, orm, t, jwt };

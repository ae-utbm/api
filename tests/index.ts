/* istanbul ignore file */

import 'tsconfig-paths/register';
import '@exported/global/utils';

import { MikroORM } from '@mikro-orm/core';
import { JwtService } from '@nestjs/jwt';
import { NestExpressApplication } from '@nestjs/platform-express';
import { TestingModule, Test } from '@nestjs/testing';
import { I18nContext, I18nService, I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';

import { AppModule } from '@app.module';
import { VALIDATION_PIPE_OPTIONS } from '@env';
import { I18nHttpExceptionFilter } from '@modules/_mixin/http-errors';

let module_fixture: TestingModule;
let jwt: JwtService;
let app: NestExpressApplication;
let server: Awaited<ReturnType<NestExpressApplication['listen']>>;

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
	app.enableCors({ origin: '*' });
	app.useGlobalPipes(new I18nValidationPipe(VALIDATION_PIPE_OPTIONS));
	app.useGlobalFilters(new I18nValidationExceptionFilter({ detailedErrors: false }), new I18nHttpExceptionFilter());

	orm = module_fixture.get<MikroORM>(MikroORM);
	jwt = module_fixture.get<JwtService>(JwtService);

	const i18nService = app.get(I18nService);
	jest.spyOn(I18nContext, 'current').mockImplementation(() => new I18nContext('en-US', i18nService));

	server = await app.listen(5325);
	await app.init();
});

// And this runs after all tests of the suite
afterAll(async () => {
	await orm.close(true);
	await app.close();
	server.close();
});

/** @deprecated */
const t = {};

export { module_fixture, server, orm, t, jwt };

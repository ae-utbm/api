import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseSeeder } from '@database/seeders/database.seeder';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AppModule } from 'src/app.module';
import { MikroORM } from '@mikro-orm/core';

import env from '@env';
import config from '@mikro-orm.config';
import path from 'path';

let app: NestExpressApplication;
let orm: MikroORM;

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
		], // Import MikroOrmModule with the provided config
	}).compile();

	app = moduleFixture.createNestApplication();
	app.setGlobalPrefix('api');
	app.enableCors({ origin: env().cors });
	app.useStaticAssets(env().files.baseDir, { index: false, prefix: '/public' });

	orm = moduleFixture.get<MikroORM>(MikroORM);
	await app.init();
});

beforeEach(async () => {
	// Drop and recreate the tables using the SchemaGenerator
	const generator = orm.getSchemaGenerator();
	await generator.dropSchema();
	await generator.createSchema();

	// Seed the database with some basic data
	const seeder = orm.getSeeder();
	await seeder.seed(DatabaseSeeder);
});

afterAll(async () => {
	await app.close();
});

export { app, orm };

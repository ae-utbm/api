import { join } from 'path';

import { MikroORM } from '@mikro-orm/core';
import { Logger } from '@nestjs/common';

import { TestSeeder } from '@database/seeders/tests.seeder';
import config from '@mikro-orm.config';

import 'tsconfig-paths/register';

/**
 * This function is used to setup the database before running the tests.
 */
async function setup() {
	Logger.log('Setting up the database...', 'database.setup.ts');

	const orm = await MikroORM.init({
		...config,
		debug: false, // Hide debug logs for the database setup
		entities: [join(__dirname, '../../dist/src/modules/**/entities/*.entity.js')],
		entitiesTs: [join(__dirname, '../src/modules/**/entities/*.entity.ts')],
	});

	// Drop and re-create the database schema
	const generator = orm.getSchemaGenerator();
	await generator.dropSchema();
	await generator.createSchema();

	// Seed the database with some basic data
	const seeder = orm.getSeeder();
	await seeder.seed(TestSeeder);

	await orm.close(true);
}

setup()
	.then(() => Logger.log('The database has been setup', 'database.setup.ts'))
	.catch((err) => Logger.error(err));

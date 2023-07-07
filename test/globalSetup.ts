import 'tsconfig-paths/register';

import path from 'path';

import { MikroORM } from '@mikro-orm/core';

import { DatabaseSeeder } from '@database/seeders/database.seeder';
import config from '@mikro-orm.config';

/**
 * This file is used to setup the database before running the tests.
 */
export default async () => {
	const orm = await MikroORM.init({
		...config,
		debug: false, // Hide debug logs for the database setup
		// Entities paths are relative to the root of the project so we need to update them
		entities: [path.join(__dirname, '../../dist/src/modules/**/*.entity.js')],
		entitiesTs: [path.join(__dirname, '../src/modules/**/*.entity.ts')],
	});

	const generator = orm.getSchemaGenerator();
	await generator.dropSchema();
	await generator.createSchema();

	// Seed the database with some basic data
	const seeder = orm.getSeeder();
	await seeder.seed(DatabaseSeeder);

	await orm.close(true);
};

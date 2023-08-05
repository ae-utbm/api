/* istanbul ignore file */

import { join } from 'path';

import { MikroORMOptions, IDatabaseDriver, Connection } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { Logger } from '@nestjs/common';

import 'dotenv/config';

const logger = new Logger('MikroORM');

/**
 * Global MikroORM configuration
 */
const config: Partial<MikroORMOptions<IDatabaseDriver<Connection>>> = {
	driver: PostgreSqlDriver,
	dbName: process.env['POSTGRES_DB'] ?? 'ae_test',
	port: parseInt(process.env['POSTGRES_PORT'], 10) ?? 5432,
	host: process.env['POSTGRES_HOST'] ?? '127.0.0.1',
	user: process.env['POSTGRES_USER'] ?? 'postgres',
	password: process.env['POSTGRES_PASSWORD'] ?? 'postgres',
	debug: (process.env['DEBUG'] ?? 'true') === 'true',
	entities: [join(__dirname, '../dist/src/modules/**/entities/*.entity.js')],
	entitiesTs: [join(__dirname, '../src/modules/**/entities/*.entity.ts')],
	highlighter: new SqlHighlighter(),
	migrations: {
		transactional: true,
		path: './dist/database/migrations',
		pathTs: './src/database/migrations',
		glob: '!(*.d).{js,ts}',
	},
	seeder: {
		defaultSeeder: 'DatabaseSeeder',
		path: './dist/database/seeders',
		pathTs: './src/database/seeders',
		glob: '!(*.d).{js,ts}',
	},
	logger: logger.log.bind(logger) as MikroORMOptions<IDatabaseDriver<Connection>>['logger'],
	metadataProvider: TsMorphMetadataProvider,
};

export default config;

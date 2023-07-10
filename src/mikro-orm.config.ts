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
	dbName: process.env['DB_NAME'] ?? 'ae_test',
	port: parseInt(process.env['DB_PORT'], 10) ?? 5432,
	host: process.env['DB_HOST'] ?? 'localhost',
	user: process.env['DB_USER'] ?? 'postgres',
	password: process.env['DB_PASSWORD'] ?? 'postgres',
	debug: process.env['DEBUG'] === 'true',
	entities: [join(__dirname, '../src/modules/**/entities/*.entity.js')],
	entitiesTs: [join(__dirname, '../../src/modules/**/entities/*.entity.ts')],
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

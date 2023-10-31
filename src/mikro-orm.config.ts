/* istanbul ignore file */

import { MikroORMOptions, IDatabaseDriver, Connection } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { Logger } from '@nestjs/common';

import { env } from '@env';

const logger = new Logger('MikroORM');

/**
 * Global MikroORM configuration
 */
const config: Partial<MikroORMOptions<IDatabaseDriver<Connection>>> = {
	driver: PostgreSqlDriver,
	dbName: env.POSTGRES_DB,
	port: env.POSTGRES_PORT,
	host: env.POSTGRES_HOST,
	user: env.POSTGRES_USER,
	password: env.POSTGRES_PASSWORD,
	debug: env.DEBUG,
	entities: ['./dist/src/modules/**/entities/*.entity.js'],
	entitiesTs: ['./src/modules/**/entities/*.entity.ts'],
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

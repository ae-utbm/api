import { MikroORMOptions, IDatabaseDriver, Connection } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Logger } from '@nestjs/common';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';

const logger = new Logger('MikroORM');

export default (): Partial<MikroORMOptions<IDatabaseDriver<Connection>>> => ({
	type: 'postgresql',
	dbName: process.env.DB_NAME,
	port: parseInt(process.env.DB_PORT, 10),
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	debug: process.env.DEBUG === 'true',
	entities: ['./dist/modules/**/entities/*.entity.js'],
	entitiesTs: ['./src/modules/**/entities/*.entity.ts'],
	highlighter: new SqlHighlighter(),
	migrations: {
		snapshot: false,
		transactional: true,
		path: './dist/database/migrations',
		pathTs: './src/database/migrations',
	},
	logger: logger.log.bind(logger),
	metadataProvider: TsMorphMetadataProvider,
});

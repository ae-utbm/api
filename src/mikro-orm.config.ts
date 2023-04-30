import { MikroORMOptions, IDatabaseDriver, Connection } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

export default (): Partial<MikroORMOptions<IDatabaseDriver<Connection>>> => ({
	type: 'postgresql',
	dbName: process.env.DB_NAME,
	port: parseInt(process.env.DB_PORT, 10),
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	debug: process.env.DEBUG === 'true',
	entities: ['./dist/modules/**/entities/*.entity.js'],
	entitiesTs: ['./dist/modules/**/entities/*.entity.ts'],
	metadataProvider: TsMorphMetadataProvider,
});

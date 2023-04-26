import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import configuration from './config/configuration';
import { AuthResolver } from './modules/auth/auth.resolver';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
		}),
		MikroOrmModule.forRoot({
			type: 'postgresql',
			dbName: 'ae_db.postgres',
			entities: ['./dist/modules/auth/entities', './dist/modules/user/entities'],
			entitiesTs: ['./src/modules/auth/entities', './src/modules/user/entities'],
			debug: true,
			metadataProvider: TsMorphMetadataProvider,
		}),
		GraphQLModule.forRoot<ApolloDriverConfig>({
			driver: ApolloDriver,
			autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
			sortSchema: true,
		}),
		UsersModule,
		AuthModule,
	],
	providers: [],
})
export class AppModule {}

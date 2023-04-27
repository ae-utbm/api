import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import configuration from './config/configuration';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
		}),
		MikroOrmModule.forRoot(),
		GraphQLModule.forRoot<ApolloDriverConfig>({
			driver: ApolloDriver,
			autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
			includeStacktraceInErrorResponses: process.env.DEBUG == 'true',
			sortSchema: true,
			playground: process.env.DEBUG === 'true',
		}),
		UsersModule,
		AuthModule,
	],
	providers: [],
})
export class AppModule {}

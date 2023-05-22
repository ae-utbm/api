import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import configuration from './config/configuration';
import { PermissionsModule } from './modules/perms/perms.module';
import { RolesModule } from './modules/roles/roles.module';
import { PromotionsModule } from '@modules/promotions/promotions.module';

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
			includeStacktraceInErrorResponses: process.env['DEBUG'] == 'true',
			sortSchema: true,
			playground: process.env['DEBUG'] === 'true',
		}),
		UsersModule,
		AuthModule,
		PermissionsModule,
		RolesModule,
		PromotionsModule,
	],
	providers: [],
})
export class AppModule {}

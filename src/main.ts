import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { graphqlUploadExpress } from 'graphql-upload-minimal';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.setGlobalPrefix('api');
	app.enableCors({ origin: '*' });
	app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }));

	await app.listen(3000);

	Logger.log(`Server running on http://localhost:3000/api`, 'Bootstrap');
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';

import { join } from 'path';

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);
	app.setGlobalPrefix('api');
	app.enableCors({ origin: '*' });

	app.useStaticAssets(join(process.cwd(), process.env['FILES_BASE_DIR'] || './public'), {
		index: false,
		prefix: '/public',
	});

	const config = new DocumentBuilder()
		.setTitle('AE UTBM - Files API')
		.setDescription('REST API endpoints for files management')
		.setVersion('1.0.0')
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api', app, document);

	await app.listen(3000);

	Logger.log(`Server running on http://localhost:3000/graphql`, 'Bootstrap');
}
bootstrap();

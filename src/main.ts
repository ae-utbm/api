import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import env from '@env';
import '@exported/global/utils';

import { AppModule } from './app.module';
import pkg from '../package.json';

/**
 * Base server bootstrap
 */
async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);
	app.enableCors({ origin: env().cors });
	app.useStaticAssets(env().files.baseDir, { index: false, prefix: '/public' });
	app.useStaticAssets('./src/swagger', { index: false, prefix: '/public' });

	const config = new DocumentBuilder()
		.setTitle('AE UTBM — REST API')
		.setDescription(
			'<a href="https://ae.utbm.fr">Back to main website</a><br/><a href="/-json">Export as JSON</a>&nbsp;—&nbsp;<a href="/-yaml">Export as YAML</a>',
		)
		.setVersion(pkg.version)
		.addBearerAuth()
		.build();

	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('', app, document, {
		customCssUrl: '/public/swagger.css',
		customJs: '/public/swagger.js',
		customfavIcon: '/public/ae_base.png',
		customSiteTitle: 'AE UTBM - REST API',
		swaggerOptions: {
			tagsSorter: 'alpha',
			operationsSorter: 'alpha',
		},
	});

	await app.listen(env().port);

	Logger.log(`Server running on http://localhost:${env().port}`, 'Swagger');
}

bootstrap()
	.then(() => Logger.log('Server started', 'Bootstrap'))
	.catch(() => Logger.error('Server crashed', 'Bootstrap'));

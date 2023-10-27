/* eslint-disable no-console */

import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';

import { Logger } from '@nestjs/common';

import 'tsconfig-paths/register';

(() => {
	Logger.log('Setting up the environment variables...', 'env.setup.ts');

	if (existsSync(join(process.cwd(), '.env'))) {
		Logger.warn('The .env file already exists, skipping...', 'env.setup.ts');
		return;
	}

	copyFileSync(join(process.cwd(), '.env.example'), join(process.cwd(), '.env'));
	Logger.log('The .env file has been created from the .env.example file', 'env.setup.ts');
})();

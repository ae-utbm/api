import 'tsconfig-paths/register';

import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';

import { Logger } from '@nestjs/common';

(() => {
	Logger.log('Setting up the environment variables...', 'env.setup.ts');

	if (existsSync(join(process.cwd(), '.env'))) {
		Logger.warn('The .env file already exists, skipping...', 'env.setup.ts');
		return;
	}

	copyFileSync(join(process.cwd(), './tests/.env.test'), join(process.cwd(), '.env'));
	Logger.log('The .env file has been created from the .env.test file', 'env.setup.ts');
})();

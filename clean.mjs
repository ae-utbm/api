/* eslint-disable no-console */
import { existsSync, rmSync } from 'node:fs';

(() => {
	const start = Date.now();
	console.log('Cleaning generated files...');

	['./coverage', './dist', './temp'].forEach((dir) => {
		if (existsSync(dir)) rmSync(dir, { recursive: true });
	});

	console.log(`Cleaning done! (in ${Date.now() - start}ms)`);
})();

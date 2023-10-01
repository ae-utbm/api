import { existsSync, rmSync } from 'fs';

(() => {
	const start = Date.now();

	console.log('Cleaning generated files...');
	if (existsSync('./coverage')) rmSync('./coverage', { recursive: true });
	if (existsSync('./dist')) rmSync('./dist', { recursive: true });
	if (existsSync('./temp')) rmSync('./temp', { recursive: true });

	console.log(`Cleaning done! (in ${Date.now() - start}ms)`);
})();

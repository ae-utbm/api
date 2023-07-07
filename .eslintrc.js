module.exports = {
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: 'tsconfig.json',
		tsconfigRootDir: __dirname,
		sourceType: 'module',
	},
	plugins: ['@typescript-eslint/eslint-plugin'],
	extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
	root: true,
	env: {
		node: true,
		jest: true,
	},
	ignorePatterns: [
		'.eslintrc.js',
		'jest.config.js',
		'dist',
		'node_modules',
		'coverage',
		'src/migrations',
		'src/types/api/i18n.d.ts',
	],
	rules: {
		'@typescript-eslint/interface-name-prefix': 'off',
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		'no-console': 'warn',
		'prettier/prettier': ['error', { endOfLine: 'lf' }],
	},
};

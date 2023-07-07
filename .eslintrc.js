module.exports = {
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: 'tsconfig.json',
		tsconfigRootDir: __dirname,
		sourceType: 'module',
	},
	plugins: ['@typescript-eslint', 'import'],
	extends: [
		'plugin:@typescript-eslint/recommended',
		'plugin:@typescript-eslint/recommended-requiring-type-checking',
		'plugin:prettier/recommended',
		'plugin:import/recommended',
		'plugin:import/typescript',
	],
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
		'src/database/migrations',
		'src/types/api/i18n.d.ts',
	],
	settings: {
		'import/resolver': {
			typescript: true,
			node: true,
		},
	},
	rules: {
		'@typescript-eslint/interface-name-prefix': 'off',
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		'no-console': 'warn',
		'prettier/prettier': ['error', { endOfLine: 'lf' }],
		'import/order': [
			'error',
			{
				'newlines-between': 'always',
				groups: ['type', 'builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
				pathGroups: [
					{
						pattern: '@(database|modules|templates|utils|src)/**',
						group: 'internal',
					},
				],
				pathGroupsExcludedImportTypes: ['builtin'],
				alphabetize: {
					order: 'asc',
					caseInsensitive: true,
				},
			},
		],
	},
};

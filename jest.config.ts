import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
	coverageReporters: ['text', 'lcov'],
	collectCoverage: true,
	coverageDirectory: 'coverage',
	// coverageThreshold: {
	// 	global: {
	// 		branches: 100,
	// 		functions: 100,
	// 		lines: 100,
	// 		statements: 100,
	// 	},
	// },
	detectOpenHandles: true,
	maxConcurrency: 1,
	moduleNameMapper: {
		'@env': '<rootDir>/src/env.ts',
		'@mikro-orm.config': '<rootDir>/src/mikro-orm.config.ts',
		'@app.module': '<rootDir>/src/app.module.ts',
		'^src/(.*)$': '<rootDir>/src/$1',
		'^@modules/(.*)$': '<rootDir>/src/modules/$1',
		'^@utils/(.*)$': '<rootDir>/src/utils/$1',
		'^@types/(.*)$': '<rootDir>/src/types/$1',
		'^@database/(.*)$': '<rootDir>/src/database/$1',
		'^@templates/(.*)$': '<rootDir>/src/templates/$1',
	},
	modulePathIgnorePatterns: ['<rootDir>/dist', '<rootDir>/node_modules'],
	preset: 'ts-jest',
	testEnvironment: 'node',
	testRegex: '.(spec|test).ts$',
	verbose: true,
};

export default config;

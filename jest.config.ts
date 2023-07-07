export default {
	preset: 'ts-jest',
	testEnvironment: 'node',
	globalSetup: '<rootDir>/test/globalSetup.ts',
	setupFilesAfterEnv: ['<rootDir>/test/setupFilesAfterEnv.ts'],
	moduleNameMapper: {
		'@env': '<rootDir>/src/env.ts',
		'@mikro-orm.config': '<rootDir>/src/mikro-orm.config.ts',
		'^src/(.*)$': '<rootDir>/src/$1',
		'^@modules/(.*)$': '<rootDir>/src/modules/$1',
		'^@utils/(.*)$': '<rootDir>/src/utils/$1',
		'^@types/(.*)$': '<rootDir>/src/types/$1',
		'^@database/(.*)$': '<rootDir>/src/database/$1',
		'^@templates/(.*)$': '<rootDir>/src/templates/$1',
	},
	coverageReporters: ['text', 'lcov'],
	collectCoverage: true,
	coverageDirectory: 'coverage',
	coverageThreshold: {
		global: {
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100,
		},
	},
	testRegex: '.(spec|test).ts$',
	moduleFileExtensions: ['ts', 'js', 'json'],
};

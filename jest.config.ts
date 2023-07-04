export default {
	preset: 'ts-jest',
	testEnvironment: 'node',
	setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
	moduleNameMapper: {
		'@env': '<rootDir>/src/env.ts',
		'@mikro-orm.config': '<rootDir>/src/mikro-orm.config.ts',
		'^src/(.*)$': '<rootDir>/src/$1',
		'^@modules/(.*)$': '<rootDir>/src/modules/$1',
		'^@utils/(.*)$': '<rootDir>/src/utils/$1',
		'^@types/(.*)$': '<rootDir>/src/types/$1',
		'^@database/(.*)$': '<rootDir>/src/database/$1',
	},
	collectCoverage: true,
	collectCoverageFrom: [
		'src/**/*.{!(module),}.ts', // Module are tested in e2e tests
		'!src/main.ts',
		'!src/**/*.d.ts',
		'!src/database/**',
	],
	coverageDirectory: 'coverage',
	coverageThreshold: {
		global: {
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100,
		},
	},
	testRegex: '.spec.ts$',
	moduleFileExtensions: ['ts', 'js', 'json'],
};

const { pathsToModuleNameMapper } = require('ts-jest');
const {
  compilerOptions: { paths: tsconfigPaths },
} = require('./tsconfig');

module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coveragePathIgnorePatterns: ['^.+\\.d\\.ts$'],

  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  moduleNameMapper: pathsToModuleNameMapper(tsconfigPaths, {
    prefix: '<rootDir>/',
  }),
  moduleDirectories: ['node_modules', 'src'],

  testPathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/test/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  verbose: true,
};

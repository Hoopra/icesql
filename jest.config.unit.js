const defaultConfig = require('./jest.config');

module.exports = {
  ...defaultConfig,
  testMatch: ['**/test/unit/**/*.test.ts']
};

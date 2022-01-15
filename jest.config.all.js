const defaults = require('./jest.config');
module.exports = {
  ...defaults,
  collectCoverage: true,
  testTimeout: 20000,
  testMatch: ['**/test/integration/**/*.test.(ts|js)', '**/test/unit/**/*.test.(ts|js)'],
};

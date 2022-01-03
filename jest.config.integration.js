const defaultConfig = require("./jest.config");

module.exports = {
  ...defaultConfig,
  testMatch: ["**/test/integration/**/*.test.ts"],
};

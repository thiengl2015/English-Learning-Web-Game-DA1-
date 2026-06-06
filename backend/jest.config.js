module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverageFrom: [
    "src/services/**/*.js",
    "!src/services/**/*.test.js",
  ],
  coverageDirectory: "coverage",
  verbose: true,
  setupFilesAfterEnv: ["./tests/setup.js"],
  testTimeout: 30000,
};

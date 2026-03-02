module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!**/node_modules/**', '!**/docs/**', '!**/tests/**', '!**/dist/**'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  verbose: true,
  testTimeout: 10000,
};

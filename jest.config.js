module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.js',
    '**/dashboard/services/*.test.js',
    '**/dashboard/controllers/*.test.js',
    '**/dashboard/tests/*.test.js',
  ],
  collectCoverageFrom: ['src/utils/**/*.js', '!**/node_modules/**', '!**/docs/**', '!**/tests/**', '!**/dist/**'],
  coverageThreshold: {
    global: {
      branches: 25,
      functions: 25,
      lines: 25,
      statements: 25,
    },
  },
  verbose: true,
  testTimeout: 10000,
};

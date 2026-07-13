module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 30000,
  verbose: true,
  // Resolve the app's "@/..." path alias (mirrors _moduleAliases in package.json).
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

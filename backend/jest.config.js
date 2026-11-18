const moduleNameMapper = { '^@/(.*)$': '<rootDir>/src/$1' };

// Two projects: unit tests need no database; integration tests use an
// isolated MongoDB test database (see tests/jest.setup.js).
module.exports = {
  testTimeout: 30000,
  verbose: true,
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
      moduleNameMapper,
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
      moduleNameMapper,
    },
  ],
};

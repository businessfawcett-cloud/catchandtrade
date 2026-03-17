module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testRegex: '(/__tests__/.*|\\.)(test|spec)\\.(ts|tsx)$',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  maxWorkers: 1,
  workerIdleMemoryLimit: '512MB',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { 
      useESM: false,
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
      }
    }],
  },
};

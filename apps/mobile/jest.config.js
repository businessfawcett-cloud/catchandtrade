module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testRegex: '(/__tests__/.*|\\.)(test|spec)\\.(ts|tsx)$',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        moduleResolution: 'bundler',
      },
    }],
    '^.+\\.js$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@catchandtrade/shared$': '<rootDir>/../shared/src/index.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@react-navigation|react-native-.*)/)',
  ],
};

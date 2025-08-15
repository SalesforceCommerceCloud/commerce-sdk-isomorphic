/* eslint-disable */
module.exports = {
  displayName: 'design',
  testEnvironment: 'jsdom',
  passWithNoTests: true,
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', {tsconfig: '<rootDir>/tsconfig.json'}]
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/test/styleMock.js',
  },
  moduleFileExtensions: ['ts', 'js', 'html', 'tsx', 'jsx'],
};

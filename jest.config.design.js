/* eslint-disable */
export default {
  displayName: 'design',
  testEnvironment: 'jsdom',
  passWithNoTests: true,
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', {tsconfig: '<rootDir>/tsconfig.design.json'}],
    '\\.(css|less|scss|sass)$': '<rootDir>/src/design/test/styleMock.js',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
};

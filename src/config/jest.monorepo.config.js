module.exports = () => ({
  transform: {
    '^.+\\.(ts|tsx|js)$': 'babel-jest',
  },
  coverageReporters: ['json'],
  collectCoverageFrom: ['<rootDir>/src/**/*.+(js|jsx|ts|tsx)'],
  // TODO: change this to testMatch: ['**/__tests__/**/*.+(js|jsx|ts|tsx)'],
  testMatch: ['<rootDir>/src/**/?(*.)spec.ts?(x)'],
  setupTestFrameworkScriptFile: '<rootDir>../../jest.setup.js',
  moduleFileExtensions: ['js', 'json', 'node', 'ts', 'tsx'],
  globals: {__DEV__: true},
  moduleNameMapper: {
    '^@form-foundations/([a-zA-Z0-9_-]+)$': `${process.cwd()} + '/packages/$1/src/index.ts`,
  },
})

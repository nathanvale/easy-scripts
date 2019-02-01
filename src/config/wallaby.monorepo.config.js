// wallaby rocks
// eslint-disable-next-line no-unused-vars
module.exports = ({scope = '', name = 'My monorepo'} = {}) => wallaby => {
  // eslint-disable-next-line no-shadow
  const setup = wallaby => {
    let jestConfig = global._modifiedJestConfig
    if (!jestConfig) {
      // eslint-disable-next-line no-multi-assign
      jestConfig = global._modifiedJestConfig = require('./jest.config.js')
      jestConfig.moduleNameMapper = {
        [`^${scope}/([a-zA-Z0-9_-]+)$`]: `${process.cwd()}/packages/$1/src/index.js`,
      }
      jestConfig.setupTestFrameworkScriptFile = './jest.setup.js'
    }
    wallaby.testFramework.configure(jestConfig)
  }

  return {
    name,
    env: {
      type: 'node',
      runner: 'node',
    },
    testFramework: 'jest',
    files: [
      './jest.settings.js',
      './jest.config.js',
      './jest.setup.js',
      'tsconfig.json',
      'packages/*/src/**',
      '!packages/**/*.spec.{ts,tsx}',
      '!**/*.d.ts',
      '!**/*.{snap}',
      '!packages/**/coverage/**',
      '!packages/**/node_modules/**',
    ],
    compilers: {
      '*.js': wallaby.compilers.babel({
        babel: require('@babel/core'),
      }),
      'packages/**/*.{ts,tsx}': wallaby.compilers.babel({
        babel: require('@babel/core'),
      }),
    },
    tests: ['packages/*/src/**/*.spec.{ts,tsx}'],
    setup,
  }
}

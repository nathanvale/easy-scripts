process.env.NODE_ENV = 'test'

const {jest: jestConfig} = require('./src/config')
const babelrc = require('./src/config/babelrc')()

const ignores = [
  ...jestConfig.testMatch.map(file => `!${jestConfig.testMatch}`),
  '!/node_modules/',
]
const files = [
  './src/config/jest.configs',
  ...jestConfig.collectCoverageFrom,
  ...ignores,
]
const tests = [
  ...jestConfig.testMatch,
  '!/node_modules/',
  // TODO: raise an issue on wallaby js to find out why this isnt passing
  '!./src/scripts/__tests__/format.js',
]

module.exports = function(wallaby) {
  const config = {
    debug: true,
    env: {
      type: 'node',
      runner: 'node',
    },
    testFramework: 'jest',
    files,
    tests,
    compilers: {
      '**/*.{js,ts,tsx}': wallaby.compilers.babel({
        babelrc: false,
        ...babelrc,
      }),
    },
  }
  return config
}

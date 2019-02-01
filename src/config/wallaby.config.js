process.env.BABEL_ENV = 'test'
process.env.NODE_ENV = 'test'

const jestConfig = require('./jest.config')
const babelrc = require('./babelrc')()

const ignores = [
  ...jestConfig.testMatch.map(file => `!${file}`),
  '!/node_modules/',
]
const files = [
  './src/config/jest.configs',
  ...jestConfig.collectCoverageFrom,
  ...ignores,
]

const tests = [...jestConfig.testMatch, '!/node_modules/']
// eslint-disable-next-line func-names
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

process.env.NODE_ENV = 'test'

const {jest: jestConfig} = require('./src/config') //?

const ignores = [
  ...jestConfig.testMatch.map(file => `!${jestConfig.testMatch}`),
  '!/node_modules/',
] //?
const files = [
  './src/config/jest.configs',
  ...jestConfig.collectCoverageFrom,
  ...ignores,
] //?
const tests = [...jestConfig.testMatch, '!/node_modules/'] //?

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
      '**/*.js': wallaby.compilers.babel({
        babelrc: false,
        presets: [
          [
            '/Users/nathanvale/code/ndv-scripts/node_modules/@babel/preset-env/lib/index.js',
            {modules: false, loose: true, targets: {node: 'current'}},
          ],
        ],
        plugins: [
          [
            '/Users/nathanvale/code/ndv-scripts/node_modules/@babel/plugin-transform-runtime/lib/index.js',
            {useESModules: false},
          ],
          '/Users/nathanvale/code/ndv-scripts/node_modules/babel-plugin-macros/dist/index.js',
          [
            '/Users/nathanvale/code/ndv-scripts/node_modules/babel-plugin-transform-react-remove-prop-types/lib/index.js',
            {mode: 'unsafe-wrap'},
          ],
          [
            '/Users/nathanvale/code/ndv-scripts/node_modules/@babel/plugin-proposal-class-properties/lib/index.js',
            {loose: true},
          ],
          '/Users/nathanvale/code/ndv-scripts/node_modules/babel-plugin-minify-dead-code-elimination/lib/index.js',
          '/Users/nathanvale/code/ndv-scripts/node_modules/@babel/plugin-transform-modules-commonjs/lib/index.js',
        ],
      }),
    },
  }
  return config
}

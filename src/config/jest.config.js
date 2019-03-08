const path = require('path')
const {hasFile, fromRoot} = require('../utils')
const {packageManager} = require('../jsonate/')

const {ifAnyDep, hasProp: hasPkgProp} = packageManager()

const here = p => path.join(__dirname, p)

const useBuiltInBabelConfig =
  !hasFile('.babelrc') &&
  !hasFile('.babelrc.js') &&
  !hasFile('.babel.config.js') &&
  !hasPkgProp('babel')

const ignores = [
  '/node_modules/',
  '/fixtures/',
  '/__tests__/helpers/',
  '__mocks__',
]

const jestConfig = {
  roots: [fromRoot('src')],
  testEnvironment: ifAnyDep(['webpack', 'rollup', 'react'], 'jsdom', 'node'),
  testURL: 'http://localhost',
  moduleFileExtensions: ['js', 'jsx', 'json', 'ts', 'tsx'],
  collectCoverageFrom: ['src/**/*.+(js|jsx|ts|tsx)'],
  testMatch: ['**/__tests__/**/*.+(js|jsx|ts|tsx)'],
  testPathIgnorePatterns: [...ignores],
  coveragePathIgnorePatterns: [...ignores, 'src/(umd|cjs|esm)-entry.js$'],
  transformIgnorePatterns: ['[/\\\\]node_modules[/\\\\].+\\.(js|jsx)$'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
}

if (useBuiltInBabelConfig) {
  jestConfig.transform = {'^.+\\.(ts|tsx|js|jsx)$': here('./babel-transform')}
}

module.exports = jestConfig

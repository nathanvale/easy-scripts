module.exports = {
  babel: require('./babelrc'),
  eslint: require('./eslintrc'),
  jest: require('./jest.config'),
  lintStaged: require('./lintstagedrc'),
  prettier: require('./prettierrc'),
  commitlint: require('./commitlint.config'),
  wallaby: require('./wallaby'),
  getRollupConfig: () => require('./rollup.config'),
}

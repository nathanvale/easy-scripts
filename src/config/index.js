module.exports = {
  babel: require('./babelrc'),
  eslint: require('./eslintrc'),
  jest: require('./jest.config'),
  lintStaged: require('./lintstagedrc'),
  prettier: require('./prettierrc.js'),
  getRollupConfig: () => require('./rollup.config'),
};

module.exports = {
  babel: require("./babelrc"),
  commitlint: require("./commitlint.config"),
  eslint: require("./eslintrc"),
  getRollupConfig: () => require("./rollup.config"),
  jest: require("./jest.config"),
  jestMonorepo: require("./jest.monorepo.config"),
  lintStaged: require("./lintstagedrc"),
  typescript: require("./tsconfig.json"),
  wallaby: require("./wallaby.config"),
  wallabyMonorepo: require("./wallaby.monorepo.config"),
};

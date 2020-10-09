const { wallaby: wallabyConfig } = require("./src/config");

// eslint-disable-next-line func-names
module.exports = function (wallaby) {
  const baseConfig = wallabyConfig(wallaby);
  const tests = [...baseConfig.tests];
  const config = {
    ...baseConfig,
    tests,
  };
  return config;
};

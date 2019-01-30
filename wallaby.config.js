const {wallaby: wallabyConfig} = require('./src/config')

// eslint-disable-next-line func-names
module.exports = function(wallaby) {
  const baseConfig = wallabyConfig(wallaby)
  const tests = [
    ...baseConfig.tests,
    // TODO: raise an issue on wallaby js to find out why this isnt passing
    '!./src/scripts/__tests__/format.js',
  ]
  const config = {
    ...baseConfig,
    tests,
  }
  return config
}

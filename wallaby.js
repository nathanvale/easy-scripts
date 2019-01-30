'use strict'

const {wallaby: wallabyConfig} = require('./src/config')

module.exports = function(wallaby) {
  const baseConfig = wallabyConfig(wallaby)
  console.log(baseConfig)
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

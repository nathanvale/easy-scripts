const {checkForTypescript} = require('../../checkers')

let result

async function build() {
  try {
    const hasTypescript = await checkForTypescript()
    if (hasTypescript) {
      const useSpecifiedExtensions = process.argv.includes('--extensions')
      if (!useSpecifiedExtensions) {
        const extensions = ['.es6', '.es', '.jsx', '.js', '.mjs', '.ts', '.tsx']
        process.argv = [...process.argv, '--extensions', extensions.join(',')]
      }
      const useSpecifiedSourceMaps = process.argv.includes('--source-maps')
      if (!useSpecifiedSourceMaps) {
        process.argv = [...process.argv, '--source-maps', 'inline']
      }
    }
    if (process.argv.includes('--bundle')) {
      result = await require('./rollup')
    } else {
      result = require('./babel').build()
      if (result.status === 0 && hasTypescript) {
        process.argv = []
        result = require('../build-types').build()
      }
      process.exit(result.status)
    }
  } catch (e) {
    //TODO: standarise the param (e or error)
    throw e
  }
}
module.exports = (async () => {
  await build()
})()

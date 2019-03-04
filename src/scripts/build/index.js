const {hasTypescriptFiles} = require('../../utils')
const {verifyTypescript} = require('../../checkers')

async function build() {
  let result

  try {
    if (hasTypescriptFiles()) {
      const t = await verifyTypescript()
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

      if (result.status > 0) throw new Error(result.message)

      if (result.status === 0 && hasTypescriptFiles()) {
        process.argv = []
        result = require('../build-types').build()
      }
      // eslint-disable-next-line no-process-exit
      process.exit(result.status)
    }
  } catch (error) {
    throw new Error(`Build FAILED ${error.message}`)
  }
}
module.exports = (async () => {
  await build()
})()

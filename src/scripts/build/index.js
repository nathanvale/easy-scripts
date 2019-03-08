const {hasTypescriptFiles, print} = require('../../utils')
const {verifyTypescript} = require('../../checkers')

async function build() {
  try {
    let result
    if (hasTypescriptFiles()) {
      await verifyTypescript()
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
      if (result.status > 0) {
        print(`Build FAILED :(`)
      } else {
        print(`Build Successful :)`)
      }

      if (result.status === 0 && hasTypescriptFiles()) {
        process.argv = []
        //TODO: move handling of result into build-types.js
        result = require('../build-types').build()
        if (result.status > 0) {
          print(`Building Types FAILED :(`)
        } else {
          print(`Build Types Successful :)`)
        }
      }
    }
  } catch (error) {
    print(`Build FAILED :(`)
    print(error)
  }
}
;(async () => {
  await build()
})()

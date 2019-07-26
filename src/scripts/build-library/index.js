/* eslint-disable no-useless-escape */
const {hasTypescriptFiles, print} = require('../../utils')

function build() {
  try {
    let result
    if (hasTypescriptFiles()) {
      //await verifyTypescript()
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
      result = require('./rollup').build()
    } else {
      result = require('./babel').build()
    }

    if (result.status > 0) {
      print(`Build FAILED ¯\_(ツ)_/¯`)
      // eslint-disable-next-line no-process-exit
      process.exit(1)
    }

    if (result.status === 0 && hasTypescriptFiles()) {
      process.argv = []
      //TODO: move handling of result into build-types.js
      result = require('../build-types').build()
      if (result.status > 0) {
        print(`Compiling type declarations FAILED ¯\_(ツ)_/¯`)
        // eslint-disable-next-line no-process-exit
        process.exit(1)
      } else {
        print(`Successfully compiled type declarations.`)
      }
    }
  } catch (error) {
    print(`Build FAILED ¯\_(ツ)_/¯`)
    print(error)
  }
}
;(async () => {
  await build()
})()

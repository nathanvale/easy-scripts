const spawn = require('cross-spawn')
const {resolveBin} = require('../utils')

const args = process.argv.slice(2)

const tscResult = spawn.sync(
  resolveBin('tsc'),
  ['--noEmit', '--watch', ...args],
  {
    stdio: 'inherit',
  },
)

// eslint-disable-next-line no-process-exit
process.exit(tscResult.status)

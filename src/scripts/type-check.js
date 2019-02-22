const spawn = require('cross-spawn')
const {resolveBin} = require('../utils')

const args = process.argv.slice(2)

const tscResult = spawn.sync(resolveBin('tsc'), ['--noEmit', ...args], {
  stdio: 'inherit',
})

process.exit(tscResult.status)

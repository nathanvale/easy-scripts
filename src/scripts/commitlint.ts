const spawn = require('cross-spawn')
const {resolveBin} = require('../utils')

const args = process.argv.slice(2)

const result = spawn.sync(resolveBin('commitlint'), args, {
  stdio: 'inherit',
})

process.exit(result.status)

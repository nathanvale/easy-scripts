const spawn = require('cross-spawn')
const {resolveBin} = require('../utils')

function build() {
  const args = process.argv.slice(2)
  const tscResult = spawn.sync(
    resolveBin('tsc'),
    ['--emitDeclarationOnly', ...args],
    {
      stdio: 'inherit',
    },
  )
  return tscResult
}

module.exports = {build}

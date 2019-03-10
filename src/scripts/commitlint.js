const spawn = require('cross-spawn')
const {resolveBin} = require('../utils')
const {hasFile, fromConfigs} = require('../utils')

const args = process.argv.slice(2)

const config =
  !args.includes('--config') &&
  !hasFile('commitlint.config.js') &&
  !hasFile('.commitlintrc.js') &&
  !hasFile('.commitlintrc.json') &&
  !hasFile('.commitlintrc.yml')
    ? ['--config', fromConfigs('commitlint.config.js')]
    : []

const result = spawn.sync(resolveBin('commitlint'), [...config, ...args], {
  stdio: 'inherit',
})

// eslint-disable-next-line no-process-exit
process.exit(result.status)

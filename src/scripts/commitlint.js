const path = require('path')
const spawn = require('cross-spawn')
const yargsParser = require('yargs-parser')
const {hasPkgProp, resolveBin, hasFile} = require('../utils')

const args = ['a', 'b']
const parsedArgs = yargsParser(args)

const here = p => path.join(__dirname, p)
const hereRelative = p => here(p).replace(process.cwd(), '.')

const useBuiltinConfig =
  !args.includes('--config') &&
  !hasFile('commitlint.config.js') &&
  !hasFile('.commitlintrc.js') &&
  !hasFile('.commitlintrc.json') &&
  !hasPkgProp('.commitlintrc.yml')

const config = useBuiltinConfig
  ? ['--config', hereRelative('../config/commitlint.config.js')]
  : []

const result = spawn.sync(resolveBin('commitlint'), args, {
  stdio: 'inherit',
})

process.exit(result.status)

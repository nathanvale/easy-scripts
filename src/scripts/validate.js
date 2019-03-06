const spawn = require('cross-spawn')
const {parseEnv, resolveBin, getConcurrentlyArgs} = require('../utils')
const {packageManager} = require('../jsonate/')

const {ifScript} = packageManager()

// pre-commit runs linting and tests on the relevant files
// so those scripts don't need to be run if we're running
// this in the context of a pre-commit hook.
const preCommit = parseEnv('SCRIPTS_PRE-COMMIT', false)

const validateScripts = process.argv[2]

const useDefaultScripts = typeof validateScripts !== 'string'

const scripts = useDefaultScripts
  ? {
      build: ifScript('build', 'npm run build --silent'),
      lint: preCommit ? null : ifScript('lint', 'npm run lint --silent'),
      test: preCommit
        ? null
        : ifScript('test', 'npm run test --silent -- --coverage'),
      flow: ifScript('flow', 'npm run flow --silent'),
    }
  : validateScripts.split(',').reduce((scriptsToRun, name) => {
      scriptsToRun[name] = `npm run ${name} --silent`
      return scriptsToRun
    }, {})

const result = spawn.sync(
  resolveBin('concurrently'),
  getConcurrentlyArgs(scripts),
  {stdio: 'inherit'},
)

// eslint-disable-next-line no-process-exit
process.exit(result.status)

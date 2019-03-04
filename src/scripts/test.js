process.env.BABEL_ENV = 'test'
process.env.NODE_ENV = 'test'

const isCI = require('is-ci')
const {parseEnv, hasFile} = require('../utils')
const {hasProp} = require('../jsonate').packageManager()

const args = process.argv.slice(2)

const watch =
  !isCI &&
  !parseEnv('SCRIPTS_PRE-COMMIT', false) &&
  !args.includes('--no-watch') &&
  !args.includes('--coverage') &&
  !args.includes('--updateSnapshot')
    ? ['--watch']
    : []

const config =
  !args.includes('--config') && !hasFile('jest.config.js') && !hasProp('jest')
    ? ['--config', JSON.stringify(require('../config/jest.config'))]
    : []

// eslint-disable-next-line jest/no-jest-import
require('jest').run([...config, ...watch, ...args])

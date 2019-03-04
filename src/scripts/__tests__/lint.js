import cases from 'jest-in-case'
import {unquoteSerializer, winPathSerializer} from '../../helpers/serializers'

jest.mock('../../utils')

expect.addSnapshotSerializer(unquoteSerializer)
expect.addSnapshotSerializer(winPathSerializer)

let crossSpawnSyncMock, originalArgv, originalExit

cases(
  'lint',
  async ({setup = () => () => {}}) => {
    // beforeEach
    crossSpawnSyncMock = require('cross-spawn').sync
    originalArgv = process.argv
    originalExit = process.exit

    process.exit = jest.fn()
    const teardown = setup()
    try {
      // tests
      await require('../lint')
      expect(crossSpawnSyncMock).toHaveBeenCalledTimes(1)
      const [firstCall] = crossSpawnSyncMock.mock.calls
      const [script, calledArgs] = firstCall
      expect([script, ...calledArgs].join(' ')).toMatchSnapshot()
      // eslint-disable-next-line no-useless-catch
      // eslint-disable-next-line no-empty
    } catch (error) {
    } finally {
      teardown()
      // afterEach
      process.exit = originalExit
      process.argv = originalArgv
      jest.resetModules()
    }
  },
  {
    'calls eslint CLI with default args': {setup: setupWithArgs()},
    qwerty: {setup: withEslintError(setupWithArgs())},
    'should compile files with --presets and --ignore-path when using built in configs': {
      setup: withBuiltInConfig(setupWithArgs()),
    },
    '--no-cache will disable caching': {
      setup: setupWithArgs(['--no-cache']),
    },
    'runs on given files, but only js files': {
      setup: setupWithArgs([
        './src/index.js',
        './package.json',
        './src/index.css',
        './src/component.js',
      ]),
    },
  },
)

function withBuiltInConfig(setupFn) {
  return function setup() {
    const {
      useBuiltInEslintConfig: useBuiltInEslintConfigMock,
      useBuiltInEslintIgnore: useBuiltInEslintIgnoreMock,
      fromConfigs,
    } = require('../../utils')
    useBuiltInEslintConfigMock.mockReturnValue(true)
    useBuiltInEslintIgnoreMock.mockReturnValue(true)
    fromConfigs.mockReturnValueOnce('~/src/config/eslintrc.js')
    fromConfigs.mockReturnValueOnce('~/src/config/eslintignore')
    const teardownFn = setupFn()
    return function teardown() {
      teardownFn()
    }
  }
}

function withEslintError(setupFn) {
  return function setup() {
    crossSpawnSyncMock.mockImplementation(() => ({
      status: 1,
      message: 'some eslint error',
    }))
    const teardownFn = setupFn()
    return async function teardown() {
      let errMessage
      try {
        await require('../lint')
      } catch (error) {
        errMessage = error.message
      }
      expect(errMessage).toMatchInlineSnapshot(`Lint FAILED some eslint error`)
      teardownFn()
    }
  }
}

function setupWithArgs(args = []) {
  return function setup() {
    const utils = require('../../utils')
    utils.resolveBin = (modName, {executable = modName} = {}) => executable
    originalArgv = process.argv
    process.argv = ['node', '../lint', ...args]
    return function teardown() {
      process.argv = originalArgv
    }
  }
}

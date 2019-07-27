import cases from 'jest-in-case'
import {unquoteSerializer, winPathSerializer} from '../../helpers/serializers'

const {prettyCalls} = require('../../helpers/pretty-calls')

jest.mock('../../utils')

expect.addSnapshotSerializer(unquoteSerializer)
expect.addSnapshotSerializer(winPathSerializer)

let crossSpawnSyncMock, originalArgv, printMock, originalExit

cases(
  'lint',
  async ({setup = () => () => {}}) => {
    // beforeEach
    jest.resetModules()
    crossSpawnSyncMock = require('cross-spawn').sync
    originalExit = process.exit
    printMock = require('../../utils').print
    process.exit = jest.fn()
    const teardown = await setup()
    try {
      // tests
      await require('../lint')
      // eslint-disable-next-line no-useless-catch
    } catch (error) {
      throw error
    } finally {
      process.exit = originalExit
      await teardown()
    }
  },
  {
    'calls eslint CLI with default args': {
      setup: withDefault(setupWithArgs()),
    },
    'should exit gracefully when an error is thrown': {
      setup: withDefault(withThrownError(setupWithArgs())),
    },
    'should print eslint fail message': {
      setup: withDefault(withEslintFail(setupWithArgs())),
    },
    'should compile files with --config and --ignore-path when using built in configs': {
      setup: withDefault(withBuiltInConfig(setupWithArgs())),
    },
    '--no-cache will disable caching': {
      setup: withDefault(setupWithArgs(['--no-cache'])),
    },
    'runs on given files, but only js,ts,tsx files': {
      setup: withDefault(
        setupWithArgs([
          './src/index.js',
          './src/index.ts',
          './src/index.tsx',
          './package.json',
          './src/index.css',
        ]),
      ),
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

function withThrownError(setupFn) {
  return function setup() {
    const error = new Error('some crazy error')
    crossSpawnSyncMock.mockImplementation(() => {
      throw error
    })
    const teardownFn = setupFn()

    return function teardown() {
      expect(prettyCalls(printMock.mock.calls)).toMatchInlineSnapshot(`
        Call 1:
          Argument 1:
            Linting FAILED ¯_(ツ)_/¯
        Call 2:
          Argument 1:
            Error: some crazy error
      `)
      teardownFn()
    }
  }
}

function withDefault(setupFn) {
  return function setup() {
    crossSpawnSyncMock.mockImplementation(() => ({
      status: 0,
    }))
    const teardownFn = setupFn()
    return function teardown() {
      expect(crossSpawnSyncMock).toHaveBeenCalledTimes(1)
      const [firstCall] = crossSpawnSyncMock.mock.calls
      const [script, calledArgs] = firstCall
      expect([script, ...calledArgs].join(' ')).toMatchSnapshot()
      teardownFn()
    }
  }
}

function withEslintFail(setupFn) {
  return function setup() {
    crossSpawnSyncMock.mockImplementation(() => ({
      status: 1,
    }))
    const teardownFn = setupFn()
    return function teardown() {
      expect(prettyCalls(printMock.mock.calls)).toMatchInlineSnapshot(`
        Call 1:
          Argument 1:
            Linting FAILED ¯_(ツ)_/¯
      `)
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

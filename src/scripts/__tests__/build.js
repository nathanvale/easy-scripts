import cases from 'jest-in-case'
import {unquoteSerializer} from '../../helpers/serializers'

jest.mock('../../utils')
jest.mock('rimraf')
jest.mock('../../checkers')

expect.addSnapshotSerializer(unquoteSerializer)
//TODO: add a mock for resolve bin
let hasTypescriptFiles, crossSpawnSyncMock, verifyTypescriptMock, originalExit

cases(
  'build',
  async ({setup = () => () => {}}) => {
    // beforeEach
    jest.resetModules()
    hasTypescriptFiles = require('../../utils').hasTypescriptFiles
    crossSpawnSyncMock = require('cross-spawn').sync
    verifyTypescriptMock = require('../../checkers').verifyTypescript
    originalExit = process.exit
    process.exit = jest.fn()
    const teardown = setup()
    try {
      await require('../build')
      //We test for errors in our setup functions instead
      // eslint-disable-next-line no-useless-catch
      // eslint-disable-next-line no-empty
    } catch (error) {
    } finally {
      teardown()
    }
    // afterEach
    process.exit = originalExit
  },
  {
    'with babel should use default args': {
      setup: withJavscript(setupWithArgs()),
    },
    'with a babel error should throw an error': {
      setup: withBabelError(withJavscript(setupWithArgs())),
    },
    'with babel should ignore files set with --ignore': {
      setup: withJavscript(setupWithArgs(['--ignore', 'somefile.js'])),
    },
    'with babel should not copy files with --no-copy-files': {
      setup: withJavscript(setupWithArgs(['--no-copy-files'])),
    },
    'with babel should compile files to a specified --out-dir': {
      setup: withJavscript(setupWithArgs(['--out-dir'])),
    },
    'with babel should compile files with --presets when using a built in config': {
      setup: withJavscript(withBuiltInConfig(setupWithArgs())),
    },
    'with typescript and no specified extenstions should also compile .ts,.tsx files': {
      setup: withTypescript(setupWithArgs()),
    },
    'with typescript and specified --extensions should only compile specified --extensions': {
      setup: withTypescript(setupWithArgs(['--extensions', '.ts'])),
    },
    'with typescript and specified --source-maps should only compile specified --source-maps': {
      setup: withTypescript(setupWithArgs(['--source-maps'])),
    },
    'with unverified typescript it should throw an error': {
      setup: withUnverifiedTs(setupWithArgs()),
    },
    // TODO: write tests for rollup
    // 'with rollup should use default args': {
    //   setup: withBuiltInConfig(setupWithArgs(['--bundle'])),
    // },
  },
)
function withBuiltInConfig(setupFn) {
  return function setup() {
    const {
      useBuiltInBabelConfig: useBuiltInBabelConfigMock,
      useBuiltInEslintIgnore: useBuiltInEslintIgnoreMock,
      fromConfigs,
    } = require('../../utils')
    useBuiltInBabelConfigMock.mockReturnValue(true)
    useBuiltInEslintIgnoreMock.mockReturnValue(true)
    fromConfigs.mockReturnValue('~/src/config/babelrc.js')
    const teardownFn = setupFn()
    return function teardown() {
      teardownFn()
    }
  }
}

function withJavscript(setupFn) {
  return function setup() {
    hasTypescriptFiles.mockReturnValue(false)
    const teardownFn = setupFn()
    return function teardown() {
      const [firstCall] = crossSpawnSyncMock.mock.calls
      const [script, calledArgs] = firstCall
      expect(crossSpawnSyncMock).toHaveBeenCalledTimes(1)
      expect([script, ...calledArgs].join(' ')).toMatchSnapshot()
      expect(process.exit).toBeCalledWith(0)
      expect(process.exit).toBeCalledTimes(1)
      teardownFn()
    }
  }
}

function withBabelError(setupFn) {
  return function setup() {
    crossSpawnSyncMock.mockImplementation(() => ({
      status: 1,
      message: 'some babel error',
    }))
    const teardownFn = setupFn()
    return async function teardown() {
      let errMessage
      try {
        await require('../build')
      } catch (error) {
        errMessage = error.message
      }
      expect(errMessage).toMatchInlineSnapshot(`Build FAILED some babel error`)
      teardownFn()
    }
  }
}

//TODO: can be refactored withJavascript
function withTypescript(setupFn) {
  return function setup() {
    hasTypescriptFiles.mockReturnValue(true)
    verifyTypescriptMock.mockResolvedValue(undefined)

    const teardownFn = setupFn()
    return function teardown() {
      const [firstCall, secondCall] = crossSpawnSyncMock.mock.calls
      const [scriptOne, calledArgsOne] = firstCall
      const [scriptTwo, calledArgsTwo] = secondCall
      expect(crossSpawnSyncMock).toHaveBeenCalledTimes(2)
      expect([scriptOne, ...calledArgsOne].join(' ')).toMatchSnapshot()
      expect([scriptTwo, ...calledArgsTwo].join(' ')).toMatchSnapshot()
      expect(process.exit).toBeCalledWith(0)
      expect(process.exit).toBeCalledTimes(1)
      teardownFn()
    }
  }
}

function withUnverifiedTs(setupFn) {
  return function setup() {
    hasTypescriptFiles.mockReturnValue(true)
    verifyTypescriptMock.mockImplementation(() => {
      throw new Error('User not found')
    })
    const teardownFn = setupFn()
    return async function teardown() {
      let errMessage
      try {
        await require('../build')
      } catch (error) {
        errMessage = error.message
      }
      expect(errMessage).toMatchInlineSnapshot(`Build FAILED User not found`)
      teardownFn()
    }
  }
}

function setupWithArgs(args = []) {
  return function setup() {
    const utils = require('../../utils')
    utils.resolveBin = (modName, {executable = modName} = {}) => executable
    const originalArgv = process.argv
    process.argv = ['node', '../build', ...args]
    return function teardown() {
      process.argv = originalArgv
    }
  }
}

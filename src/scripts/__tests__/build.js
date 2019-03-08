import cases from 'jest-in-case'
import {unquoteSerializer} from '../../helpers/serializers'

const {prettyCalls} = require('../../helpers/pretty-calls')

jest.mock('../../utils')
jest.mock('rimraf')
jest.mock('../../checkers')

expect.addSnapshotSerializer(unquoteSerializer)
//TODO: add a mock for resolve bin
let hasTypescriptFiles, crossSpawnSyncMock, verifyTypescriptMock, printMock

cases(
  'build',
  async ({setup = () => () => {}}) => {
    // beforeEach
    jest.resetModules()
    hasTypescriptFiles = require('../../utils').hasTypescriptFiles
    crossSpawnSyncMock = require('cross-spawn').sync
    verifyTypescriptMock = require('../../checkers').verifyTypescript
    printMock = require('../../utils').print
    const teardown = await setup()
    try {
      await require('../build')
      // eslint-disable-next-line no-useless-catch
    } catch (error) {
      throw error
    } finally {
      await teardown()
    }
  },
  {
    'should exit gracefully when an error is thrown': {
      setup: withThrownError(setupWithArgs()),
    },
    'with babel should use default args': {
      setup: withDefault(setupWithArgs()),
    },
    'with a babel error should print an error': {
      setup: withBabelFail(setupWithArgs()),
    },
    'with babel should ignore files set with --ignore': {
      setup: withDefault(setupWithArgs(['--ignore', 'somefile.js'])),
    },
    'with babel should not copy files with --no-copy-files': {
      setup: withDefault(setupWithArgs(['--no-copy-files'])),
    },
    'with babel should compile files to a specified --out-dir': {
      setup: withDefault(setupWithArgs(['--out-dir'])),
    },
    'with babel should compile files with --presets when using a built in config': {
      setup: withDefault(withBuiltInConfig(setupWithArgs())),
    },
    'with typescript and no specified extenstions should also compile .ts,.tsx files': {
      setup: withTypescript(withBabelTSArgsAssert(setupWithArgs())),
    },
    'with typescript and specified --extensions should only compile specified --extensions': {
      setup: withTypescript(
        withBabelTSArgsAssert(setupWithArgs(['--extensions', '.ts'])),
      ),
    },
    'with typescript and specified --source-maps should only compile specified --source-maps': {
      setup: withTypescript(
        withBabelTSArgsAssert(setupWithArgs(['--source-maps'])),
      ),
    },
    'tsc should generate types with the correct args': {
      setup: withTypescript(
        withTSCArgsAssert(setupWithArgs(['--source-maps'])),
      ),
    },
    'with a ts error should print an error': {
      setup: withTypescript(
        withBuildTypesFail(setupWithArgs(['--source-maps'])),
      ),
    },
    'with unverified typescript it should print an error': {
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

function withThrownError(setupFn) {
  return function setup() {
    const error = new Error('some crazy error')
    crossSpawnSyncMock.mockImplementation(() => {
      throw error
    })
    const teardownFn = setupFn()
    printMock.mockClear()
    return function teardown() {
      expect(prettyCalls(printMock.mock.calls)).toMatchInlineSnapshot(`
Call 1:
  Argument 1:
    Proceeding to build files with babel args:

--out-dir dist --copy-files --ignore __tests__,__mocks__ src

Call 2:
  Argument 1:
    Build FAILED :(
Call 3:
  Argument 1:
    Error: some crazy error
`)
      teardownFn()
    }
  }
}

function withBabelFail(setupFn) {
  return function setup() {
    crossSpawnSyncMock.mockImplementation(() => ({
      status: 1,
    }))
    const teardownFn = setupFn()
    return function teardown() {
      expect(prettyCalls(printMock.mock.calls)).toMatchInlineSnapshot(`
Call 1:
  Argument 1:
    Proceeding to build files with babel args:

--out-dir dist --copy-files --ignore __tests__,__mocks__ src

Call 2:
  Argument 1:
    Build FAILED :(
`)
      teardownFn()
    }
  }
}

function withBuildTypesFail(setupFn) {
  return function setup() {
    crossSpawnSyncMock.mockImplementationOnce(() => ({
      status: 0,
    }))
    crossSpawnSyncMock.mockImplementationOnce(() => ({
      status: 1,
    }))
    const teardownFn = setupFn()
    return function teardown() {
      expect(prettyCalls(printMock.mock.calls)).toMatchInlineSnapshot(`
Call 1:
  Argument 1:
    Proceeding to build files with babel args:

--out-dir dist --copy-files --ignore __tests__,__mocks__ src --source-maps --extensions .es6,.es,.jsx,.js,.mjs,.ts,.tsx

Call 2:
  Argument 1:
    Build Successful :)
Call 3:
  Argument 1:
    Building Types FAILED :(
`)
      teardownFn()
    }
  }
}

function withDefault(setupFn) {
  return function setup() {
    hasTypescriptFiles.mockReturnValue(false)
    const teardownFn = setupFn()
    return function teardown() {
      const [firstCall] = crossSpawnSyncMock.mock.calls
      const [script, calledArgs] = firstCall
      expect(crossSpawnSyncMock).toHaveBeenCalledTimes(1)
      expect([script, ...calledArgs].join(' ')).toMatchSnapshot()
      teardownFn()
    }
  }
}

function withTypescript(setupFn) {
  return function setup() {
    hasTypescriptFiles.mockReturnValue(true)
    const teardownFn = setupFn()
    return function teardown() {
      teardownFn()
    }
  }
}

function withBabelTSArgsAssert(setupFn) {
  return function setup() {
    const teardownFn = setupFn()
    return function teardown() {
      const [firstCall] = crossSpawnSyncMock.mock.calls
      const [scriptOne, calledArgsOne] = firstCall
      expect([scriptOne, ...calledArgsOne].join(' ')).toMatchSnapshot()
      teardownFn()
    }
  }
}

function withTSCArgsAssert(setupFn) {
  return function setup() {
    const teardownFn = setupFn()
    return function teardown() {
      // eslint-disable-next-line no-unused-vars
      const [_, secondCall] = crossSpawnSyncMock.mock.calls
      const [scriptTwo, calledArgsTwo] = secondCall
      expect(crossSpawnSyncMock).toHaveBeenCalledTimes(2)
      expect([scriptTwo, ...calledArgsTwo].join(' ')).toMatchSnapshot()
      teardownFn()
    }
  }
}

function withTSArgsCheck(setupFn) {
  return function setup() {
    const teardownFn = setupFn()
    return function teardown() {
      const [firstCall, secondCall] = crossSpawnSyncMock.mock.calls
      const [scriptOne, calledArgsOne] = firstCall
      const [scriptTwo, calledArgsTwo] = secondCall
      expect(crossSpawnSyncMock).toHaveBeenCalledTimes(2)
      expect([scriptOne, ...calledArgsOne].join(' ')).toMatchSnapshot()
      expect([scriptTwo, ...calledArgsTwo].join(' ')).toMatchSnapshot()
      teardownFn()
    }
  }
}

function withUnverifiedTs(setupFn) {
  return function setup() {
    hasTypescriptFiles.mockReturnValue(true)
    verifyTypescriptMock.mockImplementation(() => {
      throw new Error('Typescript is not setup!')
    })
    const teardownFn = setupFn()
    return function teardown() {
      expect(prettyCalls(printMock.mock.calls)).toMatchInlineSnapshot(`
Call 1:
  Argument 1:
    Build FAILED :(
Call 2:
  Argument 1:
    Error: Typescript is not setup!
`)
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

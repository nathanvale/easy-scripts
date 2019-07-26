/* eslint-disable max-lines-per-function */
jest.mock('../')
jest.mock('find-up')
jest.mock('fs')
jest.mock('parse-json')
jest.mock('read-pkg-up')

const {
  jsonManager: jsonManagerMock,
  tsConfigManager: tsConfigManagerMock,
  packageManager: packageManagerMock,
  __initialPackageState,
} = require('..')

let findUpSyncMock, readFileSyncMock, parseJsonMock

const TYPE_JSON_MANAGER = 'jsonManager'
const TYPE_TSCONFIG_MANAGER = 'tsConfigManager'
const TYPE_PACKAGE_MANAGER = 'packageManager'

describe('jsonManager', () => {
  testSharedAPI(TYPE_JSON_MANAGER)
  testSharedFileLoader('jsonManager')
})

describe('tsConfigManager', () => {
  testSharedAPI(TYPE_TSCONFIG_MANAGER)
  testSharedFileLoader('tsConfigManager')
  test('gets compiler option values', () => {
    const module = 'commonjs'
    const tsConfigMock = tsConfigManagerMock({
      initialState: {config: {compilerOptions: {module: 'commonjs'}}},
    })
    expect(tsConfigMock.getCompilerOption('module')).toBe(module)
  })

  test('return true if a compiler option does not exist', () => {
    const tsConfigMock = tsConfigManagerMock({
      initialState: {config: {compilerOptions: {module: 'commonjs'}}},
    })
    expect(tsConfigMock.hasCompilerOption('module')).toBe(true)
    expect(tsConfigMock.hasCompilerOption('name')).toBe(false)
  })

  test('can get files', () => {
    const files = ['foo.ts', 'bar.ts']
    const tsConfigMock = tsConfigManagerMock({initialState: {config: {files}}})
    expect(tsConfigMock.getFiles()).toBe(files)
  })
})

describe('packageManager', () => {
  testSharedAPI(TYPE_PACKAGE_MANAGER)
  test('loads a package.json when invoked', () => {
    jest.unmock('../')
    const pkg = `{
      "compilerOptions": {
        "module": "commonjs",
        "sourceMap": true
    }
    }`
    const cwd = '~/some/path/to/root'
    const configPath = '~/some/path/to/root/package.json'
    const result = {pkg, path: configPath}
    process.cwd = jest.fn(() => cwd)
    const realpathSyncMock = require('fs').realpathSync
    const readPkgUpSyncMock = require('read-pkg-up').sync
    readPkgUpSyncMock.mockImplementation(() => result)
    realpathSyncMock.mockImplementation(() => cwd)
    // eslint-disable-next-line no-shadow
    const packageManager = require('..').packageManager()
    expect(realpathSyncMock).toBeCalledWith(cwd)
    expect(realpathSyncMock).toBeCalledTimes(1)
    expect(readPkgUpSyncMock).toBeCalledWith({cwd})
    expect(packageManager.getState()).toMatchInlineSnapshot(`
Object {
  "config": "{
      \\"compilerOptions\\": {
        \\"module\\": \\"commonjs\\",
        \\"sourceMap\\": true
    }
    }",
  "configPath": "~/some/path/to/root/package.json",
  "filename": "package.json",
  "isLoaded": true,
}
`)
  })
  test('returns true if hasAnyDep', () => {
    const packageJSONMock = packageManagerMock({
      initialState: {
        config: {
          dependencies: {arrify: '*', react: '*'},
          devDependencies: {jest: '*'},
          peerDependencies: {'styled-components': '*'},
        },
      },
    })
    expect(packageJSONMock.hasAnyDep('styled-components')).toBe(true)
    expect(packageJSONMock.hasAnyDep('jest')).toBe(true)
    expect(packageJSONMock.hasAnyDep('arrify')).toBe(true)
    expect(packageJSONMock.hasAnyDep('angular')).toBe(false)
  })

  test('returns true if hasDep', () => {
    const packageJSONMock = packageManagerMock({
      initialState: {config: {dependencies: {arrify: '*', react: '*'}}},
    })
    expect(packageJSONMock.hasDep(['arrify', 'react'])).toBe(true)
    expect(packageJSONMock.hasDep(['arrify'])).toBe(true)
    expect(packageJSONMock.hasDep('arrify')).toBe(true)
    expect(packageJSONMock.hasDep('angular')).toBe(false)
  })

  test('returns true if hasDevDep', () => {
    const packageJSONMock = packageManagerMock({
      initialState: {config: {devDependencies: {jest: '*'}}},
    })
    expect(packageJSONMock.hasDevDep('jest')).toBe(true)
    expect(packageJSONMock.hasDevDep('react')).toBe(false)
  })

  test('returns true if hasPeerDep', () => {
    const packageJSONMock = packageManagerMock({
      initialState: {config: {peerDependencies: {jest: '*'}}},
    })
    expect(packageJSONMock.hasPeerDep('jest')).toBe(true)
    expect(packageJSONMock.hasPeerDep('react')).toBe(false)
  })

  test('returns true if hasScript', () => {
    const packageJSONMock = packageManagerMock({
      initialState: {config: {scripts: {test: 'jest'}}},
    })
    expect(packageJSONMock.hasScript('test')).toBe(true)
    expect(packageJSONMock.hasScript('start')).toBe(false)
  })

  test('returns true ifAnyDep', () => {
    const t = {a: 'b'}
    const f = {c: 'd'}
    const packageJSONMock = packageManagerMock({
      initialState: {
        config: {
          dependencies: {arrify: '*', react: '*'},
          devDependencies: {jest: '*'},
          peerDependencies: {'styled-components': '*'},
        },
      },
    })
    expect(packageJSONMock.ifAnyDep('styled-components', t, f)).toBe(t)
    expect(packageJSONMock.ifAnyDep('jest', t, f)).toBe(t)
    expect(packageJSONMock.ifAnyDep('arrify', t, f)).toBe(t)
    expect(packageJSONMock.ifAnyDep('angular', t, f)).toBe(f)
  })

  test('ifDep returns the true argument if true and false argument if false', () => {
    const t = {a: 'b'}
    const f = {c: 'd'}
    const packageJSONMock = packageManagerMock({
      initialState: {config: {dependencies: {react: '*'}}},
    })
    expect(packageJSONMock.ifDep('react', t, f)).toBe(t)
    expect(packageJSONMock.ifDep('preact', t, f)).toBe(f)
  })

  test('ifDevDep returns the true argument if true and false argument if false', () => {
    const t = {a: 'b'}
    const f = {c: 'd'}
    const packageJSONMock = packageManagerMock({
      initialState: {config: {devDependencies: {jest: '*'}}},
    })
    expect(packageJSONMock.ifDevDep('jest', t, f)).toBe(t)
    expect(packageJSONMock.ifDevDep('preact', t, f)).toBe(f)
  })

  test('ifPeerDep returns the true argument if true and false argument if false', () => {
    const t = {a: 'b'}
    const f = {c: 'd'}
    const packageJSONMock = packageManagerMock({
      initialState: {config: {peerDependencies: {'styled-components': '*'}}},
    })
    expect(packageJSONMock.ifPeerDep('styled-components', t, f)).toBe(t)
    expect(packageJSONMock.ifPeerDep('preact', t, f)).toBe(f)
  })

  test('ifScript returns the true argument if true and false argument if false', () => {
    const t = {a: 'b'}
    const f = {c: 'd'}
    const packageJSONMock = packageManagerMock({
      initialState: {config: {scripts: {test: 'jest'}}},
    })
    expect(packageJSONMock.ifScript('test', t, f)).toBe(t)
    expect(packageJSONMock.ifScript('dev', t, f)).toBe(f)
  })
})

function setupWithFileMock({cwd, configPath, config, filename}) {
  return function setup() {
    const originalCWD = process.cwd
    process.cwd = jest.fn(() => cwd)
    findUpSyncMock = require('find-up').sync
    findUpSyncMock.mockImplementation(() => configPath)
    readFileSyncMock = require('fs').readFileSync
    readFileSyncMock.mockImplementation(() => config)
    parseJsonMock = require('parse-json')
    parseJsonMock.mockImplementation(jest.requireActual('parse-json'))
    return function teardown() {
      expect(findUpSyncMock).toBeCalledWith(filename, {cwd})
      expect(readFileSyncMock).toBeCalledWith(configPath, 'utf8')
      expect(parseJsonMock).toBeCalledWith(config)
      process.cwd = originalCWD
    }
  }
}

function testSharedAPI(managerType) {
  const mocks = {
    jsonManager: jsonManagerMock,
    packageManager: packageManagerMock,
    tsConfigManager: tsConfigManagerMock,
  }

  const mockManager = mocks[managerType]

  describe(`shared API`, () => {
    test('gets a prop value', () => {
      const name = 'test'
      const jsonMock = mockManager({initialState: {config: {name}}})
      expect(jsonMock.getProp('name')).toBe(name)
    })

    test('gets state', () => {
      const config = {name: 'test'}
      const jsonMock = mockManager({
        initialState: {
          isLoaded: true,
          config,
          configPath: '~/some/path/to/config.json',
          filename: 'config.json',
        },
      })
      expect(jsonMock.getState()).toMatchInlineSnapshot(`
Object {
  "config": Object {
    "name": "test",
  },
  "configPath": "~/some/path/to/config.json",
  "filename": "config.json",
  "isLoaded": true,
}
`)
    })

    test('gets a subProp value', () => {
      const jsonMock = mockManager({
        initialState: {config: {dependencies: {react: '*'}}},
      })
      expect(jsonMock.getSubProp('dependencies')('react')).toBe('*')
    })

    test('returns true if a prop exists', () => {
      const jsonMock = mockManager({initialState: {config: {name: 'test'}}})
      expect(jsonMock.hasProp('name')).toBe(true)
      expect(jsonMock.hasProp('test')).toBe(false)
    })

    test('throws an error when accessing a prop on an onloaded config', () => {
      function hasProp() {
        const jsonMock = mockManager({initialState: {config: null}})
        jsonMock.hasProp()
      }
      expect(hasProp).toThrowErrorMatchingInlineSnapshot(
        `"Please load a config file first!"`,
      )
    })

    test('returns true if a subProp exists', () => {
      const jsonMock = mockManager({
        initialState: {config: {dependencies: {react: '*'}}},
      })
      expect(jsonMock.hasSubProp('dependencies')('react')).toBe(true)
      expect(jsonMock.hasSubProp('dependencies')('angular')).toBe(false)
    })

    test('ifSubProp returns the true argument if true and false argument if false', () => {
      const t = {a: 'b'}
      const f = {c: 'd'}
      const jsonMock = mockManager({
        initialState: {config: {dependencies: {react: '*'}}},
      })
      expect(jsonMock.ifSubProp('dependencies')('react', t, f)).toBe(t)
      expect(jsonMock.ifSubProp('dependencies')('preact', t, f)).toBe(f)
    })

    test('loads a file with the load method', () => {
      jest.unmock('../')
      const cwd = '~/some/path/to/root'
      const configPath = '~/some/path/to/config.json'
      const config = `{
      "age" : "24",
      "gender" : "male"
    }`
      const filename = 'config.json'
      const initialState = {
        configPath,
        isLoaded: true,
        filename,
        config: {},
      }
      const setup = setupWithFileMock({cwd, configPath, config, filename})
      const teardown = setup()
      const manager = require('..')[managerType]({initialState})
      manager.load(filename)
      expect(manager.getState()).toMatchInlineSnapshot(`
Object {
  "config": Object {
    "age": "24",
    "gender": "male",
  },
  "configPath": "~/some/path/to/config.json",
  "filename": "config.json",
  "isLoaded": true,
}
`)
      teardown()
    })

    test('reloads a loaded file with the reload method', () => {
      jest.unmock('../')
      const config = `{ 
        "key" : "value"
      }`
      const configPath = '~/some/path/to/config.json'
      const initialState = {
        configPath,
        isLoaded: true,
        filename: 'config.json',
        config: {},
      }
      readFileSyncMock = require('fs').readFileSync
      readFileSyncMock.mockImplementation(() => config)
      parseJsonMock = require('parse-json')
      parseJsonMock.mockImplementation(jest.requireActual('parse-json'))
      const manager = require('..')[managerType]({initialState})
      manager.reload()
      expect(readFileSyncMock).toBeCalledWith(configPath, 'utf8')
      expect(parseJsonMock).toBeCalledWith(config)
    })

    test('throw an error when reloaded without a configPath', () => {
      function reload() {
        jest.unmock('../')
        const initialState = {
          isLoaded: true,
          filename: 'config.json',
          config: {},
        }
        const manager = require('..')[managerType]({initialState})
        manager.reload()
      }
      expect(reload).toThrowErrorMatchingInlineSnapshot(
        `"Please load a config file first!"`,
      )
    })

    test('sets state', () => {
      const mock = mockManager()
      const state = {
        config: {name: 'test'},
        configPath: '~/some/path/to/some.json',
        filename: 'some.json',
        isLoaded: true,
      }
      mock.setState(() => state)
      expect(mock.getState()).toEqual({
        ...__initialPackageState,
        ...state,
      })
    })

    test('has access to previous state', () => {
      const mock = mockManager()
      mock.setState(prev => ({...prev, isLoaded: !prev.isLoaded}))
      expect(mock.getState().isLoaded).toBe(false)
    })
  })
}

function testSharedFileLoader(manager) {
  describe('shared file loader', () => {
    test('loads json when invoked with a filename', () => {
      jest.unmock('../')
      const config = `{
      "key" : "value"
    }`
      const cwd = '~/some/path/to/root'
      const configPath = '~/some/path/to/config.json'
      const filename = 'config.json'
      const setup = setupWithFileMock({cwd, configPath, config, filename})
      const teardown = setup()
      const mock = require('..')[manager]({filename})
      expect(mock.getState()).toMatchInlineSnapshot(`
Object {
  "config": Object {
    "key": "value",
  },
  "configPath": "~/some/path/to/config.json",
  "filename": "config.json",
  "isLoaded": true,
}
`)
      teardown()
    })
    test('throws an error when invoked without a filename', () => {
      jest.unmock('../')
      function invoke() {
        require('..')[manager]({filename: null})
      }
      expect(invoke).toThrowErrorMatchingInlineSnapshot(
        `"A filename must be passed in!"`,
      )
    })
  })
}

jest.mock('../jsonate')
jest.mock('which', () => ({sync: jest.fn(() => {})}))

let jsonateMock, whichSyncMock

beforeEach(() => {
  jest.resetModules()
  jsonateMock = require('../jsonate')
  whichSyncMock = require('which').sync
})

test('appDirectory is the dirname to the package.json', () => {
  const pkgPath = '/some/path/to'
  mockPkg({path: `${pkgPath}/package.json`})
  expect(require('../utils').appDirectory).toBe(pkgPath)
})

test('resolveNdvScripts resolves to src/index.js when in the ndv-scripts package', () => {
  mockPkg({pkg: {name: 'ndv-scripts'}})
  expect(require('../utils').resolveNdvScripts()).toBe(
    require.resolve('../').replace(process.cwd(), '.'),
  )
})

//TODO: WORKS IN JEST - raise a pull request with wallaby as to why this doesn't work???
test('resolveNdvScripts resolves to ndv-scripts if not in the ndv-scripts package', () => {
  mockPkg({pkg: {name: 'not-ndv-scripts'}})
  whichSyncMock.mockImplementationOnce(() => require.resolve('../'))
  expect(require('../utils').resolveNdvScripts()).toBe('ndv-scripts')
})

test(`resolveBin resolves to the full path when it's not in $PATH`, () => {
  expect(require('../utils').resolveBin('cross-env')).toBe(
    require.resolve('cross-env/dist/bin/cross-env').replace(process.cwd(), '.'),
  )
})

test(`resolveBin resolves to the binary if it's in $PATH`, () => {
  whichSyncMock.mockImplementationOnce(() =>
    require.resolve('cross-env/dist/bin/cross-env').replace(process.cwd(), '.'),
  )
  expect(require('../utils').resolveBin('cross-env')).toBe('cross-env')
  expect(whichSyncMock).toHaveBeenCalledTimes(1)
  expect(whichSyncMock).toHaveBeenCalledWith('cross-env')
})

test('getConcurrentlyArgs gives good args to pass to concurrently', () => {
  expect(
    require('../utils').getConcurrentlyArgs({
      build: 'echo build',
      lint: 'echo lint',
      test: 'echo test',
      validate: 'echo validate',
      a: 'echo a',
      b: 'echo b',
      c: 'echo c',
      d: 'echo d',
      e: 'echo e',
      f: 'echo f',
      g: 'echo g',
      h: 'echo h',
      i: 'echo i',
      j: 'echo j',
    }),
  ).toMatchSnapshot()
})

test('parseEnv parses the existing environment variable', () => {
  const globals = {react: 'React', 'prop-types': 'PropTypes'}
  process.env.BUILD_GLOBALS = JSON.stringify(globals)
  expect(require('../utils').parseEnv('BUILD_GLOBALS')).toEqual(globals)
  delete process.env.BUILD_GLOBALS
})

test(`parseEnv returns the default if the environment variable doesn't exist`, () => {
  const defaultVal = {hello: 'world'}
  expect(require('../utils').parseEnv('DOES_NOT_EXIST', defaultVal)).toBe(
    defaultVal,
  )
})

function mockPkg({pkg = {}, path = '/blah/package.json'}) {
  jsonateMock.packageManager().getState.mockImplementation(() => ({
    config: pkg,
    configPath: path,
  }))
}

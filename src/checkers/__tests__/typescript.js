jest.mock('glob')
jest.mock('prompts')
jest.mock('../../utils')
jest.mock('../../jsonate')
jest.mock('../../factories')
jest.mock('../../factories/helpers')

let check,
  createDoItForYouPromptMock,
  createTsconfigMock,
  execCmdMock,
  fromRootMock,
  globMock,
  hasFileMock,
  ifAnyDepMock,
  jsonateMock,
  reloadMock,
  originalExit,
  printMock,
  promptsMock

beforeEach(() => {
  jest.resetModules()
  check = require('../typescript').check
  createDoItForYouPromptMock = require('../../factories/helpers')
    .createDoItForYouPrompt
  createTsconfigMock = require('../../factories').createTsconfig
  execCmdMock = require('../../utils').execCmd
  fromRootMock = require('../../utils').fromRoot
  globMock = require('glob')
  hasFileMock = require('../../utils').hasFile
  jsonateMock = require('../../jsonate')
  ifAnyDepMock = jsonateMock.packageManager().ifAnyDep
  reloadMock = jsonateMock.packageManager().reload
  printMock = require('../../utils').print
  process.exit = jest.fn()
  promptsMock = require('prompts')
  globMock.sync.mockReturnValue([])
  hasFileMock.mockReturnValue(false)
  fromRootMock.mockReturnValue('~!(node_modules)/**/*.{ts,tsx}')
})

afterEach(() => {
  process.exit = originalExit
})

it('should return false when there is no typescript dependency and no tsconfig', async () => {
  ifAnyDepMock.mockReturnValueOnce(false).mockReturnValueOnce(false)
  const hasTypescript = await check()
  expect(globMock.sync).toBeCalledWith('~!(node_modules)/**/*.{ts,tsx}')
  expect(fromRootMock).toBeCalledWith('!(node_modules)/**/*.{ts,tsx}')
  expect(hasTypescript).toBeFalsy()
})

describe('Missing typescript', () => {
  let promptConfig
  beforeEach(() => {
    promptConfig = {name: 'mock'}
    globMock.sync.mockReturnValue(['foo.js', 'bar.js'])
    createDoItForYouPromptMock.mockReturnValue(promptConfig)
    promptsMock.mockResolvedValue({installYarn: false})
    ifAnyDepMock.mockReturnValueOnce(false).mockReturnValueOnce(false)
    hasFileMock.mockReturnValue(false)
  })

  it('should not install yarn if the user says "No thanks!"', async () => {
    await check()
    expect(printMock).toBeCalledWith(
      'WARNING: We have found typescript files in your project however you have no dependency to typescript!',
    )
    expect(printMock).toBeCalledWith('Exiting build. Please install yarn')
    expect(process.exit).toBeCalledWith(1)
  })

  it('should install yarn if the user says "Yes please!"', async () => {
    promptsMock.mockResolvedValue({installYarn: true})
    await check()
    execCmdMock.mockResolvedValue('yarn successfully installed')
    expect(execCmdMock).toBeCalledWith('yarn add -D typescript')
    expect(reloadMock).toBeCalled()
  })
})

test('should prompt user to create a tsconfig.json when one does not exist', async () => {
  ifAnyDepMock.mockReturnValue(true)
  createTsconfigMock.mockResolvedValue(true)
  await check()
  const [firstCall] = printMock.mock.calls
  const [script] = firstCall
  expect(script).toMatchInlineSnapshot(
    `"We have noticed that you have added typescript as a dependency to your project yet we can't seem to find a tsconfig.json in your root."`,
  )
  expect(createTsconfigMock).toBeCalled()
})

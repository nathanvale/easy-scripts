import {unquoteSerializer} from '../../helpers/serializers'

jest.mock('fs')
jest.mock('prompts')
jest.mock('../../utils')

expect.addSnapshotSerializer(unquoteSerializer)

let fromRootMock, writeFileSyncMock, promptsMock, printMock

beforeEach(() => {
  jest.resetModules()
  fromRootMock = require('../../utils').fromRoot
  printMock = require('../../utils').print
  writeFileSyncMock = require('fs').writeFileSync
  promptsMock = require('prompts')
})

it('should return false when the user does not want a tsconfig.json file created for them', async () => {
  promptsMock.mockImplementationOnce(() => ({shouldCreate: false}))
  const {installTsConfig} = require('../tsconfig')
  const result = await installTsConfig()
  expect(result).toBe(false)
  expect(promptsMock).toHaveBeenCalledTimes(1)
  expect(printMock.mock.calls[0]).toMatchInlineSnapshot(`
    Array [
      WARNING: Missing tsconfig.json!,
    ]
  `)
  expect(promptsMock.mock.calls[0]).toMatchInlineSnapshot(`
    Array [
      Object {
        initial: true,
        message: Create a tsconfig.json?,
        name: shouldCreate,
        type: confirm,
      },
    ]
  `)
})

it('should return true and write to a file when the user asks to have a tsconfig.json created for them', async () => {
  promptsMock.mockImplementationOnce(() => ({shouldCreate: true}))
  fromRootMock.mockImplementation(() => '~/some/path/to/tsconnfig.json')
  promptsMock.mockImplementationOnce(() => ({
    src: 'custom-src',
    dist: 'custom-dist',
  }))

  const {installTsConfig} = require('../tsconfig')
  const result = await installTsConfig()
  expect(result).toBe(true)
  expect(writeFileSyncMock).toHaveBeenCalledTimes(1)
  expect(writeFileSyncMock.mock.calls[0]).toMatchInlineSnapshot(`
    Array [
      ~/some/path/to/tsconnfig.json,
      {
      "extends": "./node_modules/@origin-digital/origin-scripts/dist/config/tsconfig.json",
      "include": ["custom-src", "types"],
      "compilerOptions": {
        "declarationDir": "custom-dist"
      }
    },
    ]
  `)
  expect(promptsMock).toHaveBeenCalledTimes(2)
  expect(promptsMock.mock.calls[0]).toMatchInlineSnapshot(`
    Array [
      Object {
        initial: true,
        message: Create a tsconfig.json?,
        name: shouldCreate,
        type: confirm,
      },
    ]
  `)
  expect(promptsMock.mock.calls[1]).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          initial: src,
          message: What is the name of your source directory?,
          name: src,
          type: text,
        },
        Object {
          initial: dist,
          message: What is the name of your dist directory?,
          name: dist,
          type: text,
        },
      ],
    ]
  `)
})

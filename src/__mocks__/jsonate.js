const jsonMananger = {
  getProp: jest.fn(),
  getState: jest.fn(),
  getSubProp: jest.fn(),
  hasProp: jest.fn(),
  hasSubProp: jest.fn(),
  ifSubProp: jest.fn(),
  load: jest.fn(),
  reload: jest.fn(),
  setState: jest.fn(),
}

const packageManager = {
  ...jsonMananger,
  getState: jest.fn(() => ({config: {}, configPath: '/blah/package.json'})),
  ifAnyDep: jest.fn(() => false),
}

const tsConfigManager = {
  ...jsonMananger,
  getCompilerOption: jest.fn(),
  hasCompilerOption: jest.fn(),
  getFiles: jest.fn(),
  hasFilesOption: jest.fn(),
}
module.exports = {
  packageManager: () => packageManager,
  tsConfigManager: () => tsConfigManager,
}

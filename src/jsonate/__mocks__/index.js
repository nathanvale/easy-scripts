const actualModule = jest.requireActual("../index");

const __initialPackageState = {
  config: {},
  configPath: "~/some/path/to/package.json",
  filename: "package.json",
  isLoaded: true,
};

const __initialTSConfigState = {
  config: {},
  configPath: "~/some/path/to/tsconfig.json",
  filename: "tsconfig.json",
  isLoaded: true,
};

const __initialJSONState = {
  config: {},
  configPath: "~/some/path/to/config.json",
  filename: "config.json",
  isLoaded: true,
};

const jsonManagerMock = {
  ...actualModule.jsonManager({
    initialState: __initialJSONState,
  }),
  load: jest.fn(),
  reload: jest.fn(),
};
const jsonManager = jest.fn(({ initialState } = {}) => {
  if (initialState) jsonManagerMock.setState(() => initialState);
  return jsonManagerMock;
});

const tsConfigMock = {
  ...actualModule.tsConfigManager({
    initialState: __initialTSConfigState,
  }),
  load: jest.fn(),
  reload: jest.fn(),
};
const tsConfigManager = jest.fn(({ initialState } = {}) => {
  if (initialState) tsConfigMock.setState(() => initialState);
  return tsConfigMock;
});

const packageMock = {
  ...actualModule.packageManager({
    initialState: __initialPackageState,
  }),
  load: jest.fn(),
  reload: jest.fn(),
};
const packageManager = jest.fn(({ initialState } = {}) => {
  if (initialState) packageMock.setState(() => initialState);
  return packageMock;
});

module.exports = {
  __initialPackageState,
  __initialTSConfigState,
  __initialJSONState,
  packageManager,
  tsConfigManager,
  jsonManager,
};

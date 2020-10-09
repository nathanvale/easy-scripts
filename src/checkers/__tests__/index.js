jest.mock("../../installers", () => ({
  installTypescriptDep: jest.fn().mockName("installTypescriptDep"),
  installTsConfig: jest.fn().mockName("installTsConfig"),
}));
jest.mock("../../jsonate");
jest.mock("../../utils");

let packageManagerMock, hasFileMock;

describe("checkers", () => {
  beforeEach(() => {
    jest.resetModules();
    packageManagerMock = require("../../jsonate").packageManager;
    hasFileMock = require("../../utils").hasFile;
  });

  it("check4TypescriptDep returns an uninstalled object", () => {
    const { check4TypescriptDep } = require("../");
    const result = check4TypescriptDep();
    expect(result).toMatchInlineSnapshot(`
  Object {
    "error": "Typescript has not been installed as a dependency of this project.",
    "installFn": [MockFunction installTypescriptDep],
    "isInstalled": false,
    "name": "Typescript dependency",
  }
  `);
  });

  it("check4TypescriptDep returns an installed object", () => {
    packageManagerMock({
      initialState: { config: { dependencies: { typescript: "*" } } },
    });
    const { check4TypescriptDep } = require("../");
    const result = check4TypescriptDep();
    expect(result).toMatchInlineSnapshot(`
  Object {
    "error": "Typescript has not been installed as a dependency of this project.",
    "installFn": [MockFunction installTypescriptDep],
    "isInstalled": true,
    "name": "Typescript dependency",
  }
  `);
  });

  it("check4TsConfig returns an uninstalled object", () => {
    hasFileMock.mockImplementation(() => false);
    const { check4TsConfig } = require("../");
    const result = check4TsConfig();
    expect(result).toMatchInlineSnapshot(`
  Object {
    "error": "Typescript must be configured with a tsconfig.json file in the root.",
    "installFn": [MockFunction installTsConfig],
    "isInstalled": false,
    "name": "tsconfig.json",
  }
  `);
  });

  it("check4TsConfig returns an installed object", () => {
    hasFileMock.mockImplementation(() => true);
    const { check4TsConfig } = require("../");
    const result = check4TsConfig();
    expect(result).toMatchInlineSnapshot(`
  Object {
    "error": "Typescript must be configured with a tsconfig.json file in the root.",
    "installFn": [MockFunction installTsConfig],
    "isInstalled": true,
    "name": "tsconfig.json",
  }
  `);
  });
});

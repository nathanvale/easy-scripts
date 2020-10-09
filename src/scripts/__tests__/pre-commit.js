/* eslint-disable jest/no-standalone-expect */
import cases from "jest-in-case";
import {
  unquoteSerializer,
  winPathSerializer,
} from "../../helpers/serializers";

expect.addSnapshotSerializer(unquoteSerializer);
expect.addSnapshotSerializer(winPathSerializer);

describe("scripts", () => {
  cases(
    "pre-commit",
    ({
      args = [],
      utils = require("../../utils"),
      hasPkgProp = () => false,
      hasFile = () => false,
    }) => {
      // beforeEach
      const { sync: crossSpawnSyncMock } = require("cross-spawn");
      const originalArgv = process.argv;
      const originalExit = process.exit;
      Object.assign(utils, {
        hasPkgProp,
        hasFile,
        resolveBin: (modName, { executable = modName } = {}) => executable,
      });
      jest.spyOn(process, "exit").mockImplementation();

      process.argv = ["node", "../pre-commit", ...args];
      utils.isOptedIn = (optIn) => optIn === "pre-commit";

      try {
        // tests
        require("../pre-commit");
        expect(crossSpawnSyncMock).toHaveBeenCalledTimes(2);
        const [firstCall, secondCall] = crossSpawnSyncMock.mock.calls;
        const [scriptOne, calledArgsOne] = firstCall;
        expect([scriptOne, ...calledArgsOne].join(" ")).toMatchSnapshot();
        const [scriptTwo, calledArgsTwo] = secondCall;
        expect([scriptTwo, ...calledArgsTwo].join(" ")).toMatchSnapshot();
        // eslint-disable-next-line no-useless-catch
      } catch (error) {
        throw error;
      } finally {
        // afterEach
        process.exit = originalExit;
        process.argv = originalArgv;
        jest.resetModules();
      }
    },
    {
      "calls lint-staged CLI with default args": {},
      "does not use built-in config with --config": {
        args: ["--config", "./custom-config.js"],
      },
      "does not use built-in config with .lintstagedrc file": {
        hasFile: (filename) => filename === ".lintstagedrc",
      },
      "does not use built-in config with lint-staged.config.js file": {
        hasFile: (filename) => filename === "lint-staged.config.js",
      },
      "does not use built-in config with lint-staged pkg prop": {
        hasPkgProp: (prop) => prop === "lint-staged",
      },
      "forwards args": {
        args: ["--verbose"],
      },
    }
  );

  test("should exit if lintstaged fails ", () => {
    const { sync: crossSpawnSyncMock } = require("cross-spawn");
    const originalExit = process.exit;
    const status = { status: 1 };
    crossSpawnSyncMock.mockReturnValueOnce(status);
    jest.spyOn(process, "exit").mockImplementation();
    require("../pre-commit");
    expect(process.exit).toBeCalledWith(1);
    process.exit = originalExit;
  });
});

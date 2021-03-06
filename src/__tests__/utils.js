jest.mock("../jsonate/");
jest.mock("which", () => ({ sync: jest.fn(() => {}) }));

const {
  packageManager: packageManagerMock,
  __initialPackageState,
} = require("../jsonate/");

let whichSyncMock;

describe("utils", () => {
  beforeEach(() => {
    whichSyncMock = require("which").sync;
    whichSyncMock.mockClear();
  });

  test("appDirectory is the dirname to the package.json", () => {
    setPackageManagerState();
    expect(require("../utils").getAppDirectory()).toBe("~/some/path/to");
  });

  test("resolveNdvScripts resolves to src/index.js when in the easy-scripts package", () => {
    setPackageManagerState({
      config: { name: "easy-scripts" },
    });
    expect(require("../utils").resolveNdvScripts()).toBe(
      require.resolve("../").replace(process.cwd(), ".")
    );
  });

  test("resolveNdvScripts resolves to easy-scripts if not in the easy-scripts package", () => {
    setPackageManagerState({ config: { name: "not-easy-scripts" } });
    whichSyncMock.mockImplementationOnce(() => require.resolve("../"));
    expect(require("../utils").resolveNdvScripts()).toBe("easy-scripts");
  });

  test(`resolveBin resolves to the full path when it's not in $PATH`, () => {
    expect(require("../utils").resolveBin("cross-env")).toBe(
      "./node_modules/cross-env/src/bin/cross-env.js"
    );
  });

  test(`resolveBin resolves to the binary if it's in $PATH`, () => {
    whichSyncMock.mockImplementationOnce(() =>
      require
        .resolve("cross-env/dist/bin/cross-env")
        .replace(process.cwd(), ".")
    );
    expect(require("../utils").resolveBin("cross-env")).toBe(
      "./node_modules/cross-env/src/bin/cross-env.js"
    );
    expect(whichSyncMock).toHaveBeenCalledTimes(1);
    expect(whichSyncMock).toHaveBeenCalledWith("cross-env");
  });

  test("getConcurrentlyArgs gives good args to pass to concurrently", () => {
    expect(
      require("../utils").getConcurrentlyArgs({
        build: "echo build",
        lint: "echo lint",
        test: "echo test",
        validate: "echo validate",
        a: "echo a",
        b: "echo b",
        c: "echo c",
        d: "echo d",
        e: "echo e",
        f: "echo f",
        g: "echo g",
        h: "echo h",
        i: "echo i",
        j: "echo j",
      })
    ).toMatchSnapshot();
  });

  test("parseEnv parses the existing environment variable", () => {
    const globals = { react: "React", "prop-types": "PropTypes" };
    process.env.BUILD_GLOBALS = JSON.stringify(globals);
    expect(require("../utils").parseEnv("BUILD_GLOBALS")).toEqual(globals);
    delete process.env.BUILD_GLOBALS;
  });

  test(`parseEnv returns the default if the environment variable doesn't exist`, () => {
    const defaultVal = { hello: "world" };
    expect(require("../utils").parseEnv("DOES_NOT_EXIST", defaultVal)).toBe(
      defaultVal
    );
  });
});

function setPackageManagerState(initialState = __initialPackageState) {
  return packageManagerMock({
    initialState,
  });
}

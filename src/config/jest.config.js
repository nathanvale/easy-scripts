const path = require("path");
const { hasFile, fromRoot } = require("../utils");
const { packageManager } = require("../jsonate/");

const { ifAnyDep, hasProp: hasPkgProp } = packageManager();

const here = (p) => path.join(__dirname, p);

const useBuiltInBabelConfig =
  !hasFile(".babelrc") &&
  !hasFile(".babelrc.js") &&
  !hasFile("babel.config.js") &&
  !hasPkgProp("babel");

const ignores = [
  "/node_modules/",
  "/fixtures/",
  "/__tests__/helpers/",
  "__mocks__",
  "dist",
];

const jestConfig = {
  roots: [fromRoot("src")],
  transform: { "^.+\\.(ts|tsx|js|jsx)$": "babel-jest" },
  testEnvironment: ifAnyDep(
    ["webpack", "rollup", "react"],
    "jest-environment-jsdom-global",
    "node"
  ),
  testURL: "http://localhost",
  moduleFileExtensions: ["js", "jsx", "json", "ts", "tsx"],
  moduleDirectories: ["src", "node_modules"],
  collectCoverageFrom: ["src/**/*.+(js|jsx|ts|tsx)"],
  testMatch: [
    "**/test/**/*.test.+(js|jsx|ts|tsx)",
    "**/__tests__/**/*.+(js|jsx|ts|tsx)",
  ],
  testPathIgnorePatterns: [...ignores],
  coveragePathIgnorePatterns: [...ignores, "src/(umd|cjs|esm)-entry.js$"],
  transformIgnorePatterns: ["[/\\\\]node_modules[/\\\\].+\\.(js|jsx)$"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageDirectory: "coverage",
  coverageReporters: ["text", "text-summary", "lcov"],
  globals: {
    __DEV__: false,
  },
};

if (useBuiltInBabelConfig) {
  jestConfig.transform = {
    "^.+\\.(ts|tsx|js|jsx)$": here("./babel-transform"),
  };
}

module.exports = jestConfig;

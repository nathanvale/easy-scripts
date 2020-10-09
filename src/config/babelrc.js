const browserslist = require("browserslist");
const semver = require("semver");
const { packageManager } = require("../jsonate/");
const { parseEnv, getAppDirectory, hasTypescriptFiles } = require("../utils");

const { BABEL_ENV, NODE_ENV, BUILD_FORMAT } = process.env;
const { ifAnyDep, getState: getPkgState } = packageManager();
const pkg = getPkgState().config;
const hasBabelRuntimeDep = Boolean(
  pkg.dependencies && pkg.dependencies["@babel/runtime-corejs3"]
);
const isCJS = BUILD_FORMAT === "cjs";
const isRollup = parseEnv("BUILD_ROLLUP", false);
const isTest = (BABEL_ENV || NODE_ENV) === "test";
const isUMD = BUILD_FORMAT === "umd";
const isWebpack = parseEnv("BUILD_WEBPACK", false);
const RUNTIME_HELPERS_WARN =
  "You should add @babel/runtime-corejs3 as dependency to your package. It will allow reusing so-called babel helpers from npm rather than bundling their copies into your files.";
const treeshake = parseEnv("BUILD_TREESHAKE", isRollup || isWebpack);

if (!isTest && !hasBabelRuntimeDep) {
  throw new Error(RUNTIME_HELPERS_WARN);
}

/**
 * use the strategy declared by browserslist to load browsers configuration.
 * fallback to the default if don't find a custom configuration
 * @see https://github.com/browserslist/browserslist/blob/master/node.js#L139
 */
const browsersConfig = browserslist.loadConfig({ path: getAppDirectory() }) || [
  "last 7 Chrome version",
  "last 7 Firefox version",
  "last 2 Edge version",
  "last 1 Safari version",
  "last 1 Android version",
  "last 1 ChromeAndroid version",
  "last 1 FirefoxAndroid version",
  "last 1 iOS version",
  "last 2 Samsung version",
  // hope we get to delete the following line one day!
  "IE >= 11",
];

const envTargets = isTest
  ? { node: "current" }
  : isWebpack || isRollup
  ? { browsers: browsersConfig }
  : { node: getNodeVersion(pkg) };
const envOptions = { modules: false, loose: true, targets: envTargets };

module.exports = () => ({
  presets: [
    [require.resolve("@babel/preset-env"), envOptions],
    ifAnyDep(["react"], [require.resolve("@babel/preset-react")]),
    hasTypescriptFiles()
      ? [require.resolve("@babel/preset-typescript")]
      : false,
  ].filter(Boolean),
  plugins: [
    [
      require.resolve("@babel/plugin-transform-runtime"),
      {
        corejs: 3,
        helpers: true,
        // By default, babel assumes babel/runtime version 7.0.0-beta.0,
        // explicitly resolving to match the provided helper functions.
        // https://github.com/babel/babel/issues/10261
        version: require("@babel/runtime/package.json").version,
        regenerator: true,
        useESModules: treeshake && !isCJS,
      },
    ],
    hasTypescriptFiles()
      ? [require.resolve("@babel/plugin-proposal-decorators"), false]
      : false,
    // Optional chaining and nullish coalescing are supported in @babel/preset-env,
    // but not yet supported in webpack due to support missing from acorn.
    // These can be removed once webpack has support.
    require.resolve("@babel/plugin-proposal-optional-chaining"),
    require.resolve("@babel/plugin-proposal-nullish-coalescing-operator"),
    require.resolve("babel-plugin-dev-expression"),
    require.resolve("@babel/plugin-syntax-dynamic-import"),
    require.resolve("@babel/plugin-syntax-import-meta"),
    require.resolve("@babel/plugin-proposal-json-strings"),
    require.resolve("@babel/plugin-proposal-numeric-separator"),
    require.resolve("babel-plugin-macros"),
    isUMD
      ? require.resolve("babel-plugin-transform-inline-environment-variables")
      : null,
    [
      require.resolve("babel-plugin-styled-components"),
      {
        uglifyPure: true,
      },
    ],
    [
      require.resolve("@babel/plugin-proposal-class-properties"),
      { loose: true },
    ],
    require.resolve("babel-plugin-minify-dead-code-elimination"),
    treeshake
      ? null
      : require.resolve("@babel/plugin-transform-modules-commonjs"),
  ].filter(Boolean),
});

function getNodeVersion({ engines: { node: nodeVersion = "8" } = {} }) {
  const oldestVersion = semver
    .validRange(nodeVersion)
    .replace(/[>=<|]/g, " ")
    .split(" ")
    .filter(Boolean)
    .sort(semver.compare)[0];
  if (!oldestVersion) {
    throw new Error(
      `Unable to determine the oldest version in the range in your package.json at engines.node: "${nodeVersion}". Please attempt to make it less ambiguous.`
    );
  }
  return oldestVersion;
}

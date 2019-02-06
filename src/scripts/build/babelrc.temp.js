"use strict";

var _browserslist = _interopRequireDefault(require("browserslist"));

var _semver = _interopRequireDefault(require("semver"));

var _utils = require("../utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _process$env = process.env,
    BABEL_ENV = _process$env.BABEL_ENV,
    NODE_ENV = _process$env.NODE_ENV,
    BUILD_FORMAT = _process$env.BUILD_FORMAT;
var isTest = (BABEL_ENV || NODE_ENV) === 'test';
var isPreact = (0, _utils.parseEnv)('BUILD_PREACT', false);
var isRollup = (0, _utils.parseEnv)('BUILD_ROLLUP', false);
var isUMD = BUILD_FORMAT === 'umd';
var isCJS = BUILD_FORMAT === 'cjs';
var isWebpack = (0, _utils.parseEnv)('BUILD_WEBPACK', false);
var treeshake = (0, _utils.parseEnv)('BUILD_TREESHAKE', isRollup || isWebpack);
var alias = (0, _utils.parseEnv)('BUILD_ALIAS', isPreact ? {
  react: 'preact'
} : undefined);
var isMonorepo = _utils.pkg.workspaces;
var hasBabelRuntimeDep = Boolean(_utils.pkg.dependencies && _utils.pkg.dependencies['@babel/runtime']);
var RUNTIME_HELPERS_WARN = 'You should add @babel/runtime as dependency to your package. It will allow reusing so-called babel helpers from npm rather than bundling their copies into your files.';

if (!isMonorepo && !treeshake && !hasBabelRuntimeDep) {
  throw new Error(RUNTIME_HELPERS_WARN);
} else if (treeshake && !isMonorepo && !isUMD && !hasBabelRuntimeDep) {
  console.warn(RUNTIME_HELPERS_WARN);
}
/**
 * use the strategy declared by browserslist to load browsers configuration.
 * fallback to the default if we don't find the custom configuration
 * @see https://github.com/browserslist/browserslist/blob/master/node.js#L139
 */


var browsersConfig = _browserslist.default.loadConfig({
  path: _utils.appDirectory
}) || ['ie 10', 'ios 7'];
var envTargets = isTest ? {
  node: 'current'
} : isWebpack || isRollup ? {
  browsers: browsersConfig
} : {
  node: getNodeVersion(_utils.pkg)
};
var envOptions = {
  modules: false,
  loose: true,
  targets: envTargets
};

module.exports = function () {
  return {
    presets: [[require.resolve('@babel/preset-env'), envOptions], (0, _utils.ifAnyDep)(['react', 'preact'], [require.resolve('@babel/preset-react'), {
      pragma: isPreact ? 'React.h' : undefined
    }]), (0, _utils.ifAnyDep)(['flow-bin'], [require.resolve('@babel/preset-flow')])].filter(Boolean),
    plugins: [[require.resolve('@babel/plugin-transform-runtime'), {
      useESModules: treeshake && !isCJS
    }], require.resolve('babel-plugin-macros'), alias ? [require.resolve('babel-plugin-module-resolver'), {
      root: ['./src'],
      alias: alias
    }] : null, [require.resolve('babel-plugin-transform-react-remove-prop-types'), isPreact ? {
      removeImport: true
    } : {
      mode: 'unsafe-wrap'
    }], isUMD ? require.resolve('babel-plugin-transform-inline-environment-variables') : null, [require.resolve('@babel/plugin-proposal-class-properties'), {
      loose: true
    }], require.resolve('babel-plugin-minify-dead-code-elimination'), treeshake ? null : require.resolve('@babel/plugin-transform-modules-commonjs')].filter(Boolean)
  };
};

function getNodeVersion(_ref) {
  var _ref$engines = _ref.engines;
  _ref$engines = _ref$engines === void 0 ? {} : _ref$engines;
  var _ref$engines$node = _ref$engines.node,
      nodeVersion = _ref$engines$node === void 0 ? '8' : _ref$engines$node;

  var oldestVersion = _semver.default.validRange(nodeVersion).replace(/[>=<|]/g, ' ').split(' ').filter(Boolean).sort(_semver.default.compare)[0];

  if (!oldestVersion) {
    throw new Error("Unable to determine the oldest version in the range in your package.json at engines.node: \"".concat(nodeVersion, "\". Please attempt to make it less ambiguous."));
  }

  return oldestVersion;
}
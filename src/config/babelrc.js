const browserslist = require('browserslist')
const semver = require('semver')
const {packageManager} = require('../jsonate/')
const {parseEnv, getAppDirectory, hasTypescriptFiles} = require('../utils')

const {BABEL_ENV, NODE_ENV, BUILD_FORMAT} = process.env
const {ifAnyDep, getState: getPkgState} = packageManager()
const isPreact = parseEnv('BUILD_PREACT', false)
const alias = parseEnv('BUILD_ALIAS', isPreact ? {react: 'preact'} : null)
const pkg = getPkgState().config
const hasBabelRuntimeDep = Boolean(
  pkg.dependencies && pkg.dependencies['@babel/runtime-corejs3'],
)
const isCJS = BUILD_FORMAT === 'cjs'
const isMonorepo = pkg.workspaces
const isRollup = parseEnv('BUILD_ROLLUP', false)
const isTest = (BABEL_ENV || NODE_ENV) === 'test'
const isUMD = BUILD_FORMAT === 'umd'
const isWebpack = parseEnv('BUILD_WEBPACK', false)
const RUNTIME_HELPERS_WARN =
  'You should add @babel/runtime-corejs3 as dependency to your package. It will allow reusing so-called babel helpers from npm rather than bundling their copies into your files.'
const treeshake = parseEnv('BUILD_TREESHAKE', isRollup || isWebpack)

if (!isMonorepo && !treeshake && !hasBabelRuntimeDep) {
  throw new Error(RUNTIME_HELPERS_WARN)
}

/**
 * use the strategy declared by browserslist to load browsers configuration.
 * fallback to the default if don't find a custom configuration
 * @see https://github.com/browserslist/browserslist/blob/master/node.js#L139
 */
const browsersConfig = browserslist.loadConfig({path: getAppDirectory()}) || [
  'last 7 Chrome version',
  'last 7 Firefox version',
  'last 2 Edge version',
  'last 1 Safari version',
  'last 1 Android version',
  'last 1 ChromeAndroid version',
  'last 1 FirefoxAndroid version',
  'last 1 iOS version',
  'last 2 Samsung version',
  // hope we get to delete the following line one day!
  'IE >= 11',
]

const envTargets = isTest
  ? {node: 'current'}
  : isWebpack || isRollup
  ? {browsers: browsersConfig}
  : {node: getNodeVersion(pkg)}
const envOptions = {
  modules: false,
  loose: true,
  targets: envTargets,
}

module.exports = () => ({
  presets: [
    [require.resolve('@babel/preset-env'), envOptions],
    ifAnyDep(
      ['react', 'preact'],
      [
        require.resolve('@babel/preset-react'),
        {pragma: isPreact ? 'React.h' : undefined},
      ],
    ),
    hasTypescriptFiles()
      ? [require.resolve('@babel/preset-typescript')]
      : false,
  ].filter(Boolean),
  plugins: [
    isTest
      ? null
      : [
          require.resolve('@babel/plugin-transform-runtime'),
          {
            corejs: {version: 3, proposals: true},
            helpers: true,
            regenerator: true,
            useESModules: treeshake && !isCJS,
          },
        ],
    require.resolve('babel-plugin-macros'),
    alias
      ? [
          require.resolve('babel-plugin-module-resolver'),
          {root: ['./src'], alias},
        ]
      : null,
    [
      require.resolve('babel-plugin-transform-react-remove-prop-types'),
      isPreact ? {removeImport: true} : {mode: 'unsafe-wrap'},
    ],
    isUMD
      ? require.resolve('babel-plugin-transform-inline-environment-variables')
      : null,
    [
      require.resolve('babel-plugin-styled-components'),
      {
        uglifyPure: true,
      },
    ],
    [require.resolve('@babel/plugin-proposal-class-properties'), {loose: true}],
    require.resolve('@babel/plugin-syntax-dynamic-import'),
    require.resolve('babel-plugin-minify-dead-code-elimination'),
    treeshake
      ? null
      : require.resolve('@babel/plugin-transform-modules-commonjs'),
  ].filter(Boolean),
})

function getNodeVersion({engines: {node: nodeVersion = '8'} = {}}) {
  const oldestVersion = semver
    .validRange(nodeVersion)
    .replace(/[>=<|]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .sort(semver.compare)[0]
  if (!oldestVersion) {
    throw new Error(
      `Unable to determine the oldest version in the range in your package.json at engines.node: "${nodeVersion}". Please attempt to make it less ambiguous.`,
    )
  }
  return oldestVersion
}

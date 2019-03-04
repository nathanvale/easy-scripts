const browserslist = require('browserslist')
const semver = require('semver')
const {packageManager} = require('../jsonate/')
const {parseEnv, getAppDirectory, print} = require('../utils')

const {BABEL_ENV, NODE_ENV, BUILD_FORMAT} = process.env
const {ifAnyDep, getState: getPkgState} = packageManager()
const isPreact = parseEnv('BUILD_PREACT', false)
const alias = parseEnv('BUILD_ALIAS', isPreact ? {react: 'preact'} : null)
const pkg = getPkgState().config
const hasBabelRuntimeDep = Boolean(
  pkg.dependencies && pkg.dependencies['@babel/runtime'],
)
const isCJS = BUILD_FORMAT === 'cjs'
const isMonorepo = pkg.workspaces
const isRollup = parseEnv('BUILD_ROLLUP', false)
const isTest = (BABEL_ENV || NODE_ENV) === 'test'
const isUMD = BUILD_FORMAT === 'umd'
const isWebpack = parseEnv('BUILD_WEBPACK', false)
const RUNTIME_HELPERS_WARN =
  'You should add @babel/runtime as dependency to your package. It will allow reusing so-called babel helpers from npm rather than bundling their copies into your files.'
const treeshake = parseEnv('BUILD_TREESHAKE', isRollup || isWebpack)

if (!isMonorepo && !treeshake && !hasBabelRuntimeDep) {
  throw new Error(RUNTIME_HELPERS_WARN)
  //TODO: offer to install it
} else if (treeshake && !isMonorepo && !isUMD && !hasBabelRuntimeDep) {
  print(RUNTIME_HELPERS_WARN)
}

/**
 * use the strategy declared by browserslist to load browsers configuration.
 * fallback to the default if don't find a custom configuration
 * @see https://github.com/browserslist/browserslist/blob/master/node.js#L139
 */
const browsersConfig = browserslist.loadConfig({path: getAppDirectory()}) || [
  'ie 10',
  'ios 7',
]

const envTargets = isTest
  ? {node: 'current'}
  : isWebpack || isRollup
  ? {browsers: browsersConfig}
  : {node: getNodeVersion(pkg)}
const envOptions = {modules: false, loose: true, targets: envTargets}

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
    ifAnyDep(['flow-bin'], [require.resolve('@babel/preset-flow')]),
    ifAnyDep(['typescript'], [require.resolve('@babel/preset-typescript')]),
  ].filter(Boolean),
  plugins: [
    [
      require.resolve('@babel/plugin-transform-runtime'),
      {useESModules: treeshake && !isCJS},
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
    [require.resolve('@babel/plugin-proposal-class-properties'), {loose: true}],
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

const path = require('path')
const glob = require('glob')
const camelcase = require('lodash.camelcase')
const rollupBabel = require('rollup-plugin-babel')
const commonjs = require('rollup-plugin-commonjs')
const nodeResolve = require('rollup-plugin-node-resolve')
const json = require('rollup-plugin-json')
const replace = require('rollup-plugin-replace')
const {terser} = require('rollup-plugin-terser')
const nodeBuiltIns = require('rollup-plugin-node-builtins')
const nodeGlobals = require('rollup-plugin-node-globals')
const {sizeSnapshot} = require('rollup-plugin-size-snapshot')
const omit = require('lodash.omit')
const {packageManager} = require('../jsonate/')
const {ifTypescriptProject} = require('../utils')

const extensions = ['.js', '.jsx', '.es6', '.es', '.mjs', '.ts', '.tsx']
const {getState: getPkgState, hasProp: hasPkgProp} = packageManager()

const {
  useBuiltInBabelConfig,
  parseEnv,
  fromRoot,
  fromConfigs,
} = require('../utils')

const pkg = getPkgState().config

const here = p => path.join(__dirname, p)
const capitalize = s => s[0].toUpperCase() + s.slice(1)

const minify = parseEnv('BUILD_MINIFY', false)
const format = process.env.BUILD_FORMAT
const isPreact = parseEnv('BUILD_PREACT', false)
const isNode = parseEnv('BUILD_NODE', false)
const name = process.env.BUILD_NAME || capitalize(camelcase(pkg.name))
const useSizeSnapshot = parseEnv('BUILD_SIZE_SNAPSHOT', false)

const esm = format === 'esm'
const umd = format === 'umd'

const defaultGlobals = Object.keys(pkg.peerDependencies || {}).reduce(
  (deps, dep) => {
    deps[dep] = capitalize(camelcase(dep))
    return deps
  },
  {},
)

const deps = Object.keys(pkg.dependencies || {})
const peerDeps = Object.keys(pkg.peerDependencies || {})
const defaultExternal = umd ? peerDeps : deps.concat(peerDeps)

const input = glob.sync(
  fromRoot(
    process.env.BUILD_INPUT ||
      `src/index.${ifTypescriptProject() ? 'ts' : 'js'}`,
  ),
)

const filenameSuffix = process.env.BUILD_FILENAME_SUFFIX || ''
const filenamePrefix =
  process.env.BUILD_FILENAME_PREFIX || (isPreact ? 'preact/' : '')
const globals = parseEnv(
  'BUILD_GLOBALS',
  isPreact ? Object.assign(defaultGlobals, {preact: 'preact'}) : defaultGlobals,
)

const external = parseEnv(
  'BUILD_EXTERNAL',
  isPreact ? defaultExternal.concat(['preact', 'prop-types']) : defaultExternal,
).filter((e, i, arry) => arry.indexOf(e) === i)

if (isPreact) {
  delete globals.react
  delete globals['prop-types']
  external.splice(external.indexOf('react'), 1)
}

const externalPattern = new RegExp(`^(${external.join('|')})($|/)`)

function externalPredicate(id) {
  const isDep = externalPattern.test(id)
  const isRelative = id.startsWith('.')
  if (umd) {
    // for UMD, we want to bundle all non-peer deps
    return !isRelative && !path.isAbsolute(id) && isDep
  }
  // for esm/cjs we want to make all node_modules external
  // TODO: support bundledDependencies if someone needs it ever...
  const isNodeModule = id.includes('node_modules')
  return isDep || (!isRelative && !path.isAbsolute(id)) || isNodeModule
}

const filename = [
  pkg.name,
  filenameSuffix,
  `.${format}`,
  minify ? '.min' : null,
  '.js',
]
  .filter(Boolean)
  .join('')

const dirpath = path.join(...[filenamePrefix, 'dist'].filter(Boolean))

const output = [
  {
    name,
    file: path.join(dirpath, filename),
    format: esm ? 'es' : format,
    exports: esm ? 'named' : 'auto',
    globals,
  },
]
const args = process.argv.slice(2)
const useBuiltinConfig = useBuiltInBabelConfig(args)
const babelPresets = useBuiltinConfig ? [fromConfigs('babelrc.js')] : []
const replacements = Object.entries(
  umd ? process.env : omit(process.env, ['NODE_ENV']),
).reduce((acc, [key, value]) => {
  let val
  if (value === 'true' || value === 'false' || Number.isInteger(+value)) {
    val = value
  } else {
    val = JSON.stringify(value)
  }
  acc[`process.env.${key}`] = val
  return acc
}, {})

const config = {
  input: input[0],
  output,
  external: externalPredicate,
  plugins: [
    isNode ? nodeBuiltIns() : null,
    isNode ? nodeGlobals() : null,
    nodeResolve({
      preferBuiltins: isNode,
      jsnext: true,
      main: true,
      extensions,
    }),
    commonjs({include: 'node_modules/**'}),
    json(),
    rollupBabel({
      exclude: '/**/node_modules/**',
      presets: babelPresets,
      babelrc: !useBuiltinConfig,
      runtimeHelpers: true,
      extensions,
    }),
    replace(replacements),
    useSizeSnapshot ? sizeSnapshot({printInfo: false}) : null,
    minify ? terser() : null,
  ].filter(Boolean),
}

module.exports = config

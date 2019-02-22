//TODO: imporve test converage
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const which = require('which')
const arrify = require('arrify')
const {packageManager} = require('./jsonate')

const {getState: getPkgState, hasProp: hasPkgProp} = packageManager()
const appDirectory = path.dirname(getPkgState().configPath)

function resolveNdvScripts() {
  if (getPkgState().config.name === 'ndv-scripts') {
    return require.resolve('./').replace(process.cwd(), '.')
  }
  return resolveBin('ndv-scripts')
}

// eslint-disable-next-line complexity
function resolveBin(modName, {executable = modName, cwd = process.cwd()} = {}) {
  let pathFromWhich
  try {
    pathFromWhich = fs.realpathSync(which.sync(executable))
  } catch (_error) {
    // ignore _error
  }
  try {
    const modPkgPath = require.resolve(`${modName}/package.json`)
    const modPkgDir = path.dirname(modPkgPath)
    const {bin} = require(modPkgPath)
    const binPath = typeof bin === 'string' ? bin : bin[executable]
    const fullPathToBin = path.join(modPkgDir, binPath)
    if (fullPathToBin === pathFromWhich) {
      return executable
    }
    return fullPathToBin.replace(cwd, '.')
  } catch (error) {
    if (pathFromWhich) {
      return executable
    }
    throw error
  }
}

const fromRoot = (...p) => path.join(appDirectory, ...p)
const hasFile = (...p) => fs.existsSync(fromRoot(...p))
const ifFile = (files, t, f) =>
  arrify(files).some(file => hasFile(file)) ? t : f

function parseEnv(name, def) {
  if (envIsSet(name)) {
    try {
      return JSON.parse(process.env[name])
    } catch (err) {
      return process.env[name]
    }
  }
  return def
}

function envIsSet(name) {
  return (
    process.env.hasOwnProperty(name) &&
    process.env[name] &&
    process.env[name] !== 'undefined'
  )
}

function getConcurrentlyArgs(scripts, {killOthers = true} = {}) {
  const colors = [
    'bgBlue',
    'bgGreen',
    'bgMagenta',
    'bgCyan',
    'bgWhite',
    'bgRed',
    'bgBlack',
    'bgYellow',
  ]
  scripts = Object.entries(scripts).reduce((all, [name, script]) => {
    if (script) {
      all[name] = script
    }
    return all
  }, {})
  const prefixColors = Object.keys(scripts)
    .reduce(
      (pColors, _s, i) =>
        pColors.concat([`${colors[i % colors.length]}.bold.reset`]),
      [],
    )
    .join(',')

  // prettier-ignore
  return [
    killOthers ? '--kill-others-on-fail' : null,
    '--prefix', '[{name}]',
    '--names', Object.keys(scripts).join(','),
    '--prefix-colors', prefixColors,
    ...Object.values(scripts).map(s => JSON.stringify(s)), // stringify escapes quotes ✨
  ].filter(Boolean)
}

function isOptedOut(key, t = true, f = false) {
  if (!fs.existsSync(fromRoot('.opt-out'))) {
    return f
  }
  const contents = fs.readFileSync(fromRoot('.opt-out'), 'utf-8')
  return contents.includes(key) ? t : f
}

function isOptedIn(key, t = true, f = false) {
  if (!fs.existsSync(fromRoot('.opt-in'))) {
    return f
  }
  const contents = fs.readFileSync(fromRoot('.opt-in'), 'utf-8')
  return contents.includes(key) ? t : f
}

function uniq(arr) {
  return Array.from(new Set(arr))
}

function writeExtraEntry(name, {cjs, esm}, clean = true) {
  if (clean) {
    rimraf.sync(fromRoot(name))
  }
  mkdirp.sync(fromRoot(name))

  const pkgJson = fromRoot(`${name}/package.json`)
  const entryDir = fromRoot(name)

  fs.writeFileSync(
    pkgJson,
    JSON.stringify(
      {
        main: path.relative(entryDir, cjs),
        'jsnext:main': path.relative(entryDir, esm),
        module: path.relative(entryDir, esm),
      },
      null,
      2,
    ),
  )
}

//TODO: should this throw an error?
function createConfig(p, c) {
  fs.writeFileSync(p, c, err => {
    if (err) {
      console.log(err)
    }
    console.log('The file was saved!')
  })
}

function execCmd(command, options = {}, silent = true) {
  if (!silent) {
    //TODO: use print to colwidth here .... DONE
    console.log(command)
  }
  return exec(command, options)
    .then(response => response.stdout)
    .catch(error => {
      if (error.stderr === '') return error.stdout
      throw error
    })
}

function wait(timeout) {
  return new Promise(resolve => {
    setTimeout(() => resolve(), timeout)
  })
}

function print(message) {
  console.info(message)
}

function useBuiltInBabelConfig(args) {
  return (
    !args.includes('--presets') &&
    !hasFile('.babelrc') &&
    !hasFile('.babelrc.js') &&
    !hasFile('babel.config.js') &&
    !hasPkgProp('babel')
  )
}

function fromConfigs(p) {
  return path.join(fromRoot('src/config'), p)
}

module.exports = {
  appDirectory,
  createConfig,
  envIsSet,
  execCmd,
  fromRoot,
  fromConfigs,
  getConcurrentlyArgs,
  hasFile,
  ifFile,
  isOptedIn,
  isOptedOut,
  parseEnv,
  print,
  resolveBin,
  resolveNdvScripts,
  uniq,
  useBuiltInBabelConfig,
  wait,
  writeExtraEntry,
}

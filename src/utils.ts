import arrify from 'arrify'
import fs from 'fs'
import {has} from 'lodash'
import mkdirp from 'mkdirp'
import path from 'path'
import readPkgUp from 'read-pkg-up'
import rimraf from 'rimraf'
import which from 'which'

const {pkg, path: pkgPath} = readPkgUp.sync({
  cwd: fs.realpathSync(process.cwd()),
})
const appDirectory = path.dirname(pkgPath)
console.log('appDirectory', appDirectory)

function resolveNdvScripts() {
  if (pkg.name === 'ndv-scripts') {
    return require.resolve('./').replace(process.cwd(), '.')
  }
  return resolveBin('ndv-scripts')
}

// eslint-disable-next-line complexity
function resolveBin(
  modName: string,
  {executable = modName, cwd = process.cwd()} = {},
) {
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

const fromRoot = (p: string, ...rest: string[]) => path.join(appDirectory, ...p)
const hasFile = (p: string, ...rest: string[]) => fs.existsSync(fromRoot(p))
const ifFile = (files: string[], t?: any, f?: any): boolean =>
  arrify<string>(files).some(file => hasFile(file)) ? t : f

const hasPkgProp = (props: any) =>
  arrify<string>(props).some(prop => has(pkg, prop))

const hasPkgSubProp = (pkgProp: string) => (props: any) =>
  hasPkgProp(arrify<string>(props).map(p => `${pkgProp}.${p}`))

const ifPkgSubProp = (pkgProp: string) => (props: any, t?: any, f?: any) =>
  hasPkgSubProp(pkgProp)(props) ? t : f

const hasScript = hasPkgSubProp('scripts')
const hasPeerDep = hasPkgSubProp('peerDependencies')
const hasDep = hasPkgSubProp('dependencies')
const hasDevDep = hasPkgSubProp('devDependencies')
const hasAnyDep = (args: string[]) =>
  [hasDep, hasDevDep, hasPeerDep].some(fn => fn(args))

const ifPeerDep = ifPkgSubProp('peerDependencies')
const ifDep = ifPkgSubProp('dependencies')
const ifDevDep = ifPkgSubProp('devDependencies')
const ifAnyDep = (deps: string[], t?: any, f?: any) =>
  hasAnyDep(arrify<string>(deps)) ? t : f
const ifScript = ifPkgSubProp('scripts')

function parseEnv(name: string, def: any): any {
  if (envIsSet(name)) {
    try {
      return JSON.parse(process.env[name] as string)
    } catch (err) {
      return process.env[name]
    }
  }
  return def
}

function envIsSet(name: string) {
  return (
    process.env.hasOwnProperty(name) &&
    process.env[name] &&
    process.env[name] !== 'undefined'
  )
}

function getConcurrentlyArgs(
  scripts: {[key: string]: string},
  {killOthers = true} = {},
) {
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
  scripts = Object.entries(scripts).reduce(
    (all: {[key: string]: string}, [name, script]) => {
      if (script) {
        all[name] = script
      }
      return all
    },
    {},
  )
  const prefixColors = Object.keys(scripts)
    .reduce(
      (pColors: string[], _s, i) =>
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

function isOptedOut(key: string, t: any = true, f: any = false) {
  if (!fs.existsSync(fromRoot('.opt-out'))) {
    return f
  }
  const contents = fs.readFileSync(fromRoot('.opt-out'), 'utf-8')
  return contents.includes(key) ? t : f
}

function isOptedIn(key: string, t = true, f = false) {
  if (!fs.existsSync(fromRoot('.opt-in'))) {
    return f
  }
  const contents = fs.readFileSync(fromRoot('.opt-in'), 'utf-8')
  return contents.includes(key) ? t : f
}

function uniq(arr: []) {
  return Array.from(new Set(arr))
}

function writeExtraEntry(
  name: string,
  {cjs, esm}: {cjs: string; esm: string},
  clean = true,
) {
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

export {
  appDirectory,
  envIsSet,
  fromRoot,
  getConcurrentlyArgs,
  hasFile,
  hasPkgProp,
  hasScript,
  ifAnyDep,
  ifDep,
  ifDevDep,
  ifFile,
  ifPeerDep,
  ifScript,
  isOptedIn,
  isOptedOut,
  parseEnv,
  pkg,
  resolveBin,
  resolveNdvScripts,
  uniq,
  writeExtraEntry,
}

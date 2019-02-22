const fs = require('fs')
const arrify = require('arrify')
const findUp = require('find-up')
const get = require('lodash.get')
const has = require('lodash.has')
const parseJson = require('parse-json')
const readPkgUp = require('read-pkg-up')

//TODO: this cant be shared across config managers
let state = {
  config: undefined,
  configPath: undefined,
  filename: undefined,
  isLoaded: false,
}

function jsonManagerHOC({configFn}) {
  const setState = fn => (state = {...state, ...fn(state)})
  const getState = () => state

  const load = (filename, {cwd = process.cwd()} = {}) => {
    if (!filename) throw new Error('A filename must be passed in!')
    const configPath = findUp.sync(filename, {cwd})
    if (!configPath) throw new Error(`${filename} not found!`)
    const config = parseJson(fs.readFileSync(configPath, 'utf8'))
    setState(() => ({configPath, config, isLoaded: true, filename}))
  }

  const reload = () => {
    if (!state.config) throw new Error(`Please load a config file first!`)
    setState(() => ({isLoaded: false}))
    const config = parseJson(fs.readFileSync(state.configPath, 'utf8'))
    setState(() => ({config, isLoaded: true}))
  }

  const getProp = prop => get(state.config, `${prop}`)

  const getSubProp = prop => subProp => get(state.config, `${prop}.${subProp}`)

  const hasProp = props => {
    if (!state.config) {
      throw new Error('Please load a config file first!')
    }
    return arrify(props).some(prop => has(state.config, prop))
  }

  const hasSubProp = prop => props =>
    hasProp(arrify(props).map(p => `${prop}.${p}`))

  const ifSubProp = prop => (props, t, f) => (hasSubProp(prop)(props) ? t : f)

  return configFn({
    getProp,
    getState,
    getSubProp,
    hasProp,
    hasSubProp,
    ifSubProp,
    load,
    reload,
    setState,
  })
}

//TODO: add jsonManager

const packageManager = (cwd = process.cwd()) =>
  jsonManagerHOC({
    configFn: props => {
      const {hasSubProp, ifSubProp, setState, getState} = props
      if (!getState().isLoaded) {
        const {pkg: config, path: configPath} = readPkgUp.sync({
          cwd: fs.realpathSync(cwd),
        })
        setState(() => ({config, configPath, isLoaded: true}))
      }
      const hasAnyDep = args =>
        [
          hasSubProp('dependencies'),
          hasSubProp('devDependencies'),
          hasSubProp('peerDependencies'),
        ].some(fn => fn(args))

      const hasDep = dep => hasSubProp('dependencies')(dep)

      const hasDevDep = devDep => hasSubProp('devDependencies')(devDep)

      const hasPeerDep = peerDep => hasSubProp('peerDependencies')(peerDep)

      const hasScript = script => hasSubProp('scripts')(script)

      const ifAnyDep = (deps, t, f) => (hasAnyDep(arrify(deps)) ? t : f)

      const ifDep = ifSubProp('dependencies')

      const ifDevDep = ifSubProp('devDependencies')

      const ifPeerDep = ifSubProp('peerDependencies')

      const ifScript = ifSubProp('scripts')

      return {
        ...props,
        hasAnyDep,
        hasDep,
        hasDevDep,
        hasPeerDep,
        hasScript,
        ifAnyDep,
        ifDep,
        ifDevDep,
        ifPeerDep,
        ifScript,
      }
    },
  })
const tsConfigManager = (
  filename = 'tsconfig.json',
  {cwd = process.cwd()} = {},
) =>
  jsonManagerHOC({
    configFn: props => {
      const {getState} = props
      if (!getState().isLoaded) {
        props.load(filename, {cwd})
      }
      const getCompilerOption = compilerOption =>
        props.getSubProp('compilerOptions')(compilerOption)
      const getFiles = () => props.getProp('files')
      const hasCompilerOption = compilerOption =>
        props.hasSubProp('compilerOptions')(compilerOption)
      const hasFilesOption = () => props.hasProp('files')
      return {
        ...props,
        getCompilerOption,
        hasCompilerOption,
        getFiles,
        hasFilesOption,
      }
    },
  })

//TODO: convert this into unit tests
// console.log(packageManager())
// console.log(packageManager().hasProp('name'))
// console.log(packageManager().getState())
// console.log(packageManager().hasAnyDep(['arrify']))
// console.log(packageManager().hasDep('@babel/cli'))
// console.log(packageManager().hasDevDep('slash'))
// console.log(packageManager().hasPeerDep('react'))
// console.log(packageManager().hasProp(['name']))
// console.log(packageManager().hasScript('build'))
// console.log(packageManager().hasSubProp('dependencies')(['babel-core']))
// console.log(packageManager().ifDep('doctoc', true, false))
// console.log(packageManager().ifDevDep('slash', true, false))
// console.log(packageManager().ifPeerDep('react', true, false))
// console.log(packageManager().ifScript('build', true, false))
// console.log(packageManager().reload())
// console.log(packageManager().getState())
// console.log(tsConfigManager('test.json').getCompilerOption('module'))
// console.log(tsConfigManager('test.json').getFiles())
// console.log(tsConfigManager('test.json').hasCompilerOption('noImplicitAny'))
// console.log(tsConfigManager('test.json').hasFilesOption())
// console.log(tsConfigManager('test.json').getState())

module.exports = {
  packageManager,
  tsConfigManager,
}

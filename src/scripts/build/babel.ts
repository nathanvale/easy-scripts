import path from 'path'
import spawn from 'cross-spawn'
import rimraf from 'rimraf'
import {hasPkgProp, fromRoot, resolveBin, hasFile} from '../../utils'
import {transformFileSync} from '@babel/core'
import fs from 'fs'

const args = process.argv.slice(2)
const here = (p: string) => path.join(__dirname, p)

const useBuiltinConfig =
  !args.includes('--presets') &&
  !hasFile('.babelrc') &&
  !hasFile('.babelrc.js') &&
  !hasFile('babel.config.js') &&
  !hasPkgProp('babel')

console.log(here('../../config/babelrc.ts'))

console.log(hasFile('.babelrc'))

const transformed = transformFileSync(here('../../config/babelrc.ts')).code
fs.writeFileSync(here('./babelrc.temp.js'), transformed)

/* const config = useBuiltinConfig
  ? ['--presets', here('../../config/babelrc.ts')]
  : [] */

const config = useBuiltinConfig ? ['--presets', here('./babelrc.temp.js')] : []

const ignore = args.includes('--ignore')
  ? []
  : ['--ignore', '__tests__,__mocks__']

const copyFiles = args.includes('--no-copy-files') ? [] : ['--copy-files']

const useSpecifiedOutDir = args.includes('--out-dir')
const outDir = useSpecifiedOutDir ? [] : ['--out-dir', 'dist']
const extensions = ['--extensions', '.ts']

if (!useSpecifiedOutDir && !args.includes('--no-clean')) {
  rimraf.sync(fromRoot('dist'))
}

const result = spawn.sync(
  resolveBin('@babel/cli', {executable: 'babel'}),
  [...extensions, ...outDir, ...copyFiles, ...ignore, ...config, 'src'].concat(
    args,
  ),
  {stdio: 'inherit'},
)

process.exit(result.status)

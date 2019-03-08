const spawn = require('cross-spawn')
const rimraf = require('rimraf')
const {
  fromRoot,
  fromConfigs,
  resolveBin,
  print,
  useBuiltInBabelConfig,
} = require('../../utils')

function build() {
  const args = process.argv.slice(2)
  const useBuiltinConfig = useBuiltInBabelConfig(args)

  const config = useBuiltinConfig
    ? ['--presets', fromConfigs('babelrc.js')]
    : []

  const ignore = args.includes('--ignore')
    ? []
    : ['--ignore', '__tests__,__mocks__']

  const copyFiles = args.includes('--no-copy-files') ? [] : ['--copy-files']
  const useSpecifiedOutDir = args.includes('--out-dir')
  const outDir = useSpecifiedOutDir ? [] : ['--out-dir', 'dist']

  if (!useSpecifiedOutDir && !args.includes('--no-clean')) {
    rimraf.sync(fromRoot('dist'))
  }

  const finalArgs = [
    ...outDir,
    ...config,
    ...copyFiles,
    ...ignore,
    'src',
  ].concat(args)

  print(
    `Proceeding to build files with babel args:\n\n${finalArgs.join(' ')}\n`,
  )

  const result = spawn.sync(
    resolveBin('@babel/cli', {executable: 'babel'}),
    finalArgs,
    {stdio: 'inherit'},
  )

  return result
}

module.exports = {
  build,
}

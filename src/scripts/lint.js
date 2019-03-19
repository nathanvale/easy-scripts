const spawn = require('cross-spawn')
const yargsParser = require('yargs-parser')
const {
  resolveBin,
  fromConfigs,
  useBuiltInEslintConfig,
  useBuiltInEslintIgnore,
  print,
} = require('../utils')

function lint() {
  try {
    let args = process.argv.slice(2)
    const parsedArgs = yargsParser(args)

    const useBuiltinConfig = useBuiltInEslintConfig(args)

    const useSpecifiedExtensions = args.includes('--ext')
    if (!useSpecifiedExtensions) {
      const extensions = ['.js', '.jsx', '.ts', '.tsx']
      args = [...args, '--ext', extensions.join(',')]
    }

    const config = useBuiltinConfig
      ? ['--config', fromConfigs('eslintrc.js')]
      : []

    const useBuiltinIgnore = useBuiltInEslintIgnore(args)

    const ignore = useBuiltinIgnore
      ? ['--ignore-path', fromConfigs('eslintignore')]
      : []

    const cache = args.includes('--no-cache') ? [] : ['--cache']

    const filesGiven = parsedArgs._.length > 0

    const filesToApply = filesGiven ? [] : ['.']

    if (filesGiven) {
      // we need to take all the flag-less arguments (the files that should be linted)
      // and filter out the ones that aren't js files. Otherwise json or css files
      // may be passed through
      args = args.filter(
        a =>
          !parsedArgs._.includes(a) ||
          a.endsWith('.js') ||
          a.endsWith('.ts') ||
          a.endsWith('.tsx'),
      )
    }

    const result = spawn.sync(
      resolveBin('eslint'),
      [...config, ...ignore, ...cache, ...args, ...filesToApply],
      {stdio: 'inherit'},
    )

    if (result.status > 0) {
      print(`Linting FAILED :(`)
    } else {
      print(`Linting Successful :)`)
    }
    // We have to process exit here for lintstaged
    // eslint-disable-next-line no-process-exit
    process.exit(result.status)
  } catch (error) {
    print(`Linting FAILED :(`)
    print(error)
  }
}

;(async () => {
  await lint()
})()

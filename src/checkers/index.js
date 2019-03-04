const {installTypescriptDep, installTsConfig} = require('../installers')
const {hasFile} = require('../utils')
const {packageManager} = require('../jsonate')

function check4TypescriptDep() {
  const packageJSON = packageManager()
  const hasTypescriptDep = packageJSON.ifAnyDep(['typescript'], true, false)
  return {
    name: 'Typescript dependency',
    isInstalled: hasTypescriptDep,
    installFn: installTypescriptDep,
    error: 'Typescript has not been installed as a dependency of this project.',
  }
}

function check4TsConfig() {
  const hasTsconfig = hasFile('tsconfig.json')
  return {
    name: 'tsconfig.json',
    isInstalled: hasTsconfig,
    installFn: installTsConfig,
    error:
      'Typescript must be configured with a tsconfig.json file in the root.',
  }
}

async function verifyTypescript() {
  const tsCheckers = [check4TypescriptDep(), check4TsConfig()]
  for (const tsChecker of tsCheckers) {
    if (!tsChecker.isInstalled) {
      // We dont want async parallelization so we are ok with await
      // inside a loop
      // eslint-disable-next-line no-await-in-loop
      const isInstalled = await tsChecker.installFn()
      if (!isInstalled) {
        throw new Error(tsChecker.error)
      }
    }
  }
}

module.exports = {check4TsConfig, check4TypescriptDep, verifyTypescript}

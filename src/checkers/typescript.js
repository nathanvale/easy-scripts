const glob = require('glob')
const prompts = require('prompts')
const {packageManager} = require('../jsonate')
const {execCmd, fromRoot, hasFile, print} = require('../utils')

const {ifAnyDep, reload: reloadPackageJSON} = packageManager()
const {createTsconfig} = require('../factories')
const {createDoItForYouPrompt} = require('../factories/helpers')

async function check() {
  try {
    let hasTSConfig = false
    const hasTypescriptFiles =
      glob.sync(fromRoot('!(node_modules)/**/*.{ts,tsx}')).length > 0

    if (hasTypescriptFiles && !ifAnyDep(['typescript'], true)) {
      print(
        'WARNING: We have found typescript files in your project however you have no dependency to typescript!',
      )
      const {installYarn} = await prompts([
        createDoItForYouPrompt({
          name: 'installYarn',
          message: 'Would you like me to install typescript for you?',
        }),
      ])
      if (installYarn) {
        await execCmd('yarn add -D typescript')
        // We need to reload the package.json into the utils.ts module
        reloadPackageJSON()
      } else {
        print('Exiting build. Please install yarn')
        process.exit(1)
      }
    }

    hasTSConfig = hasFile('tsconfig.json')

    if (ifAnyDep(['typescript'], true) && !hasTSConfig) {
      print(
        `We have noticed that you have added typescript as a dependency to your project yet we can't seem to find a tsconfig.json in your root.`,
      )
      hasTSConfig = await createTsconfig()
    }
    return hasTSConfig
    //TODO: check tsconfig has a dir
  } catch (error) {
    throw error
  }
}

module.exports = {check}

const fs = require('fs')
const prompts = require('prompts')
const {fromRoot, print} = require('../utils')

async function installTsConfig() {
  print('WARNING: Missing tsconfig.json!')
  const {shouldCreate} = await prompts({
    type: 'confirm',
    name: 'shouldCreate',
    message: 'Create a tsconfig.json?',
    initial: true,
  })

  if (!shouldCreate) return false
  const questions = [
    {
      type: 'text',
      name: 'src',
      message: 'What is the name of your source directory?',
      initial: 'src',
    },
    {
      type: 'text',
      name: 'dist',
      message: 'What is the name of your dist directory?',
      initial: 'dist',
    },
  ]
  const answers = await prompts(questions)
  fs.writeFileSync(fromRoot('tsconfig.json'), tsconfigFactory(answers))
  //TODO: create a reporting progress lib like jest
  //TODO: tell the user what we have done after its created
  return true
}
function tsconfigFactory({src, dist}) {
  return `{
  "extends": "./node_modules/easy-scripts/dist/config/tsconfig.json",
  "include": ["${src}", "types"],
  "compilerOptions": {
    "declarationDir": "${dist}"
  }
}`
}

module.exports = {installTsConfig}

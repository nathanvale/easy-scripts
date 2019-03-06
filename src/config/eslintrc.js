const {packageManager} = require('../jsonate/')
const {ifTypescriptProject} = require('../utils')

const {ifAnyDep} = packageManager()
module.exports = {
  extends: [
    require.resolve('eslint-config-nathanvale'),
    require.resolve('eslint-config-nathanvale/jest'),
    ifTypescriptProject(require.resolve('eslint-config-nathanvale/typescript')),
    ifAnyDep('react', require.resolve('eslint-config-nathanvale/jsx-a11y')),
    ifAnyDep('react', require.resolve('eslint-config-nathanvale/react')),
  ].filter(Boolean),
  rules: {
    'import/no-unresolved': ifTypescriptProject('off', 'error'),
  },
}

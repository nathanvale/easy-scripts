const {packageManager} = require('../jsonate/')
const {ifTypescriptProject} = require('../utils')

const {ifAnyDep} = packageManager()
module.exports = {
  extends: [
    require.resolve('eslint-config-ndv'),
    require.resolve('eslint-config-ndv/jest'),
    ifTypescriptProject(require.resolve('eslint-config-ndv/typescript')),
    ifAnyDep('react', require.resolve('eslint-config-ndv/jsx-a11y')),
    ifAnyDep('react', require.resolve('eslint-config-ndv/react')),
  ].filter(Boolean),
  rules: {
    'import/no-unresolved': ifTypescriptProject('off', 'error'),
  },
}

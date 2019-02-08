const {ifAnyDep} = require('../utils')

module.exports = {
  extends: [
    require.resolve('eslint-config-ndv'),
    require.resolve('eslint-config-ndv/jest'),
    ifAnyDep('react', require.resolve('eslint-config-ndv/jsx-a11y')),
    ifAnyDep('react', require.resolve('eslint-config-ndv/react')),
  ].filter(Boolean),
  rules: {},
}

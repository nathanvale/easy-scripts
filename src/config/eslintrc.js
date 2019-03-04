const {packageManager} = require('../jsonate/')

const {ifAnyDep} = packageManager()
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    require.resolve('eslint-config-ndv'),
    require.resolve('eslint-config-ndv/jest'),
    ifAnyDep('react', require.resolve('eslint-config-ndv/jsx-a11y')),
    ifAnyDep('react', require.resolve('eslint-config-ndv/react')),
  ].filter(Boolean),
  rules: {
    indent: 'off',
    '@typescript-eslint/indent': ['error', 2],
  },
}

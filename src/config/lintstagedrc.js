const {packageManager} = require('../jsonate/')
const {resolveNdvScripts, resolveBin, isOptedOut} = require('../utils')

const ndvScripts = resolveNdvScripts()
const doctoc = resolveBin('doctoc')
const {ifAnyDep, hasAnyDep} = packageManager()

const isTypeScript = !hasAnyDep('lerna') && hasAnyDep('typescript')
const isLernaTypeScript = hasAnyDep('lerna') && hasAnyDep('typescript')

module.exports = {
  '**/*package.json': [
    hasAnyDep('lerna') ? () => `${resolveBin('lerna')} link convert` : false,
    ifAnyDep('lerna', 'yarn bootstrap'),
    'prettier-package-json --write',
    'git add',
    ifAnyDep('lerna', 'git add yarn.lock'),
  ].filter(Boolean),
  '**/*.ts?(x)': () =>
    isLernaTypeScript
      ? [`${resolveBin('tsc')} --build`]
      : isTypeScript
      ? [`${resolveBin('tsc')} --noEmit`]
      : [],
  'README.md': [`${doctoc} --maxlevel 4 --notitle`, 'git add'],
  '**/*.+(js|json|less|css|ts|tsx|md)': [
    isOptedOut('autoformat', null, `${ndvScripts} format`),
    `${ndvScripts} lint`,
    `${ndvScripts} test --findRelatedTests --passWithNoTests`,
    isOptedOut('autoformat', null, 'git add'),
  ].filter(Boolean),
}

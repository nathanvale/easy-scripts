const {resolveNdvScripts, resolveBin, isOptedOut} = require('../utils')

const ndvScripts = resolveNdvScripts()
const doctoc = resolveBin('doctoc')
//TODO:: support https://www.npmjs.com/package/prettier-package-json
module.exports = {
  concurrent: false,
  linters: {
    'README.md': [`${doctoc} --maxlevel 3 --notitle`, 'git add'],
    '.all-contributorsrc': [
      `${ndvScripts} contributors generate`,
      'git add README.md',
    ],
    '**/*.+(js|json|less|css|ts|tsx|md)': [
      isOptedOut('autoformat', null, `${ndvScripts} format`),
      `${ndvScripts} lint`,
      `${ndvScripts} test --findRelatedTests --passWithNoTests`,
      isOptedOut('autoformat', null, 'git add'),
    ].filter(Boolean),
  },
}

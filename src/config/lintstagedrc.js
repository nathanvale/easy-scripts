const {resolveNdvScripts, resolveBin, isOptedOut} = require('../utils')

const ndvScripts = resolveNdvScripts()
const doctoc = resolveBin('doctoc')

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
      `${ndvScripts} lint --fix`,
      `${ndvScripts} test --findRelatedTests --passWithNoTests`,
      isOptedOut('autoformat', null, 'git add'),
    ].filter(Boolean),
  },
}

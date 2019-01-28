'use strict'
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-case': [1, 'always', 'lower-case'],
    'subject-case': [1, 'always', ['lower-case']],
  },
}

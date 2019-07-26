const spawn = require('cross-spawn')
const {fromRoot} = require('../utils')

function clean() {
  try {
    spawn.sync('rm', ['-rf', fromRoot('./dist')], {stdio: 'inherit'})
    // eslint-disable-next-line no-empty
  } catch (error) {}
}

;(async () => {
  await clean()
})()

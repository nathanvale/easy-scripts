const shared = require('./shared').shared
//TODO: compose the load logic as it is shared with tsconfigManager
const jsonManager = ({filename, cwd = process.cwd(), initialState = {}} = {}) =>
  shared({
    initialState,
    configFn: props => {
      const {getState} = props
      if (!getState().isLoaded) {
        props.load(filename, {cwd})
      }
      return {
        ...props,
      }
    },
  })

module.exports = {
  jsonManager,
}

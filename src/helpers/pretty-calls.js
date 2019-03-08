function prettyCalls(calls) {
  const argumentMapper = (item, argIndex) => `Argument ${argIndex + 1}:
    ${item}`
  const reducer = (previousValue, currentValue, currentCallIndex) => `${
    previousValue === '' ? previousValue : `${previousValue}\n`
  }Call ${currentCallIndex + 1}:
  ${currentValue.map(argumentMapper)}`
  return calls.reduce(reducer, '')
}

module.exports = {prettyCalls}

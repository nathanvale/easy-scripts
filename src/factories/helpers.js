function createDoItForYouPrompt({type = 'select', name, message} = {}) {
  return {
    type,
    name,
    message,
    choices: [
      {
        title: `"No thank you. I can do that myself."`,
        value: false,
      },
      {
        title: `"Yes please! That would be awesome! :)"`,
        value: true,
      },
    ],
    initial: 1,
  }
}

module.exports = {
  createDoItForYouPrompt,
}

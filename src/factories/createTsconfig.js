//TODO: improve test coverage
const fs = require('fs')
const prompts = require('prompts')
const {fromRoot} = require('../utils')
const {createDoItForYouPrompt} = require('./helpers')

function tsconfigFactory({src, dist}) {
  return `{
  "extends": "./node_modules/ndv-scripts/dist/config/tsconfig.json",
  "include": [
    "${src}",
    "types"
  ],
  "compilerOptions": {
    "declarationDir": "${dist}"
  }
}`
}

async function createTsconfig() {
  let questions, answers
  questions = [
    {
      type: 'select',
      name: 'question1',
      message: 'Do you want this to be a typescript project?  ¯_(ツ)_/¯',
      choices: [
        {
          title: `"It's cool man. I don't want this to be a typescript project."`,
          value: false,
        },
        {
          title: `"Doh!, let me quit building so I can add a tsconfig.json to my root."`,
          value: true,
        },
      ],
      initial: 1,
    },
    createDoItForYouPrompt({
      type: prev => prev && 'select',
      name: 'question2',
      message: `Oh wait! Would you like me to just create one for you?`,
    }),
  ]

  answers = await prompts(questions)

  if (!answers.question1) {
    console.log('Please remove typescript as a dependency to your project.')
  }

  if (answers.question1 && answers.question2) {
    questions = [
      {
        type: 'text',
        name: 'src',
        message: 'What is the name of your source directory?',
        initial: 'src',
      },
      {
        type: 'text',
        name: 'dist',
        message: 'What is the name of your dist directory?',
        initial: 'dist',
      },
    ]
    answers = await prompts(questions)
    //TODO: make this async
    fs.writeFileSync(fromRoot('tsconfig.json'), tsconfigFactory(answers))
    //TODO: create a reporting progress lib like jest
    console.log('Making a tsconfig.json for you...DONE')
    //TODO: tell the user what we have done after its created
    return true
  }

  if (answers.question1 && !answers.question2) {
    //TODO:sh tell the user to add a tsconfig and start the build again.
    process.exit(1)
  }

  return false
}
module.exports = createTsconfig

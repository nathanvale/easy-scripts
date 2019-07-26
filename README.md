<div align="center">
<h1>easy-scripts</h1>

<p>CLI toolbox for common scripts</p>
</div>

<hr />

## The problem

Configuring and maintaining all the dependencies we have to other developer's code is repetitive work and a cognitive load for us all.

## This solution

A CLI tool that abstracts away all our configuration needs, such as linting, testing and building. This tool then specifies these configurations with a high level, constrained API on top. It's API being as simple as a set of npm scripts.

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Installation](#installation)
- [Usage](#usage)
  - [Default configs](#default-configs)
  - [Overriding/Extending Configs](#overridingextending-configs)
    - [Prettier](#prettier)
    - [Eslint](#eslint)
    - [Babel](#babel)
    - [Jest](#jest)
  - [Typescript support](#typescript-support)
  - [Husky and commitlint support](#husky-and-commitlint-support)
  - [CI support](#ci-support)
- [Inspiration](#inspiration)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

This module should be installed as one of your project's `devDependencies`:

```
npm install --save-dev easy-scripts
yarn add -D easy-scripts
```

## Usage

This CLI exposes a bin called `easy-scripts`. You'll find all available scripts in `src/easy-scripts`.

Externally scripts can be called in the command line:

```
npx easy-scripts {scriptName}
```

or as npm scripts:

```
  "scripts": {
    "build": "easy-scripts build-library",
    "format": "easy-scripts format",
    "lint": "easy-scripts lint",
    "test": "easy-scripts test",
    "validate":"easy-scripts validate"
  }
```

Internally easy-scripts dogfoods itself. If you look in the `package.json`, you'll find scripts with

```
node src {scriptName}
```

### Default configs

All scripts come with default built in configs so you can get to work straight away without any configuration. You don't need to configure anything if you don't want to. For example, when executing `npx easy-scripts lint`, easy-scripts with use it's internal eslintrc.js if it cannot find any eslint config files in your project.

### Overriding/Extending Configs

> Note: easy-scripts intentionally does not merge things for you when you start configuring. This is to make it less magical and more straightforward. Extending can take place on your terms.

Unlike `react-scripts`, `easy-scripts` allows you to specify your own configurations and have that plug directly into the way things work with `easy-scripts`. If you want to have your own config for something, just add the configuration and `easy-scripts` will use that instead of it's own internal config. In addition `easy-scripts` exposes its configuration so you can use it to override/extend only the parts of the config you need to.

This can also be a way to make editor integration work for tools like ESLint which require project-based ESLint configuration to be present to work.

#### Prettier

`npx easy-scripts format`

Use a JavaScript, JSON or YAML file to specify configuration information. This can be in the form of an `.prettierrc` or `prettier.config.js` file in your root or an `prettier` field in your package.json file, both of which `easy-scripts` will look for and read automatically. You can also specify a configuration file in the command line script itself, `npx easy-scripts format --config=path/to/some/config.js`.

_Example of a .prettier.config.js root config that extends easy-scripts built in prettier.config.js_

```
  const prettierConfig = require('easy-scripts/dist/config/prettier.config')
  module.exports = Object.assign(prettierConfig, {
    ...your own rules here
  })
```

#### Eslint

`npx easy-scripts format`

Use a JavaScript, JSON or YAML file to specify configuration information. This can be in the form of an `.eslintrc` or `.eslintrc.js` file in your root or an `eslintConfig` field in your package.json file, both of which `easy-scripts` will look for and read automatically. You can also specify a configuration file in the command line script itself, `npx easy-scripts lint --config=path/to/some/config.js`.

_Example of a config that extends easy-scripts built in eslintrc.js:_

```
{
  "extends": "./node_modules/easy-scripts/dist/config/eslintrc.js",
  "rules": {
  "some-enforced-rule-i-do-not-like":"off",
  "some-new-rule-i-want-to-use:"error"
  }
}


```

> Note: for now, you'll have to include an `.eslintignore` in your root or `eslintIgnore` in your package.json until [this eslint issue is resolved](https://github.com/eslint/eslint/issues/9227).

```
 "eslintIgnore": [
    "dist",
    "*.d.ts"
  ],
```

#### Babel

Use a JavaScript or JSON file to specify configuration information. This can be in the form of an `.babelrc`, `.babelrc.js` or `babel.config.js` file in your root or a `babel` field in your package.json file, both of which easy-scripts will look for and read automatically. You can also specify a configuration file in the command line script itself, `npx easy-scripts build-library --preset=path/to/some/preset.js`.

_Example of a config that extends easy-scripts built in babelrc.js:_

```
{
    "presets": [
      "./node_modules/easy-scripts/dist/config/babelrc.js"
    ],
    "plugins:['some-other-plugin-i-want-to use-in-my-project]
}
```

#### Jest

`npx easy-scripts test`

> Note: by default `npx easy-scripts test` runs in jest watch mode on changed files only. Please add jest arguments to change this behavior. eg `npx easy-scripts test --all` to run all tests - although `npx easy-scripts validate` does this for you - see [CI support](#ci-support). All jest cli options are available as https://jestjs.io/docs/en/cli

Use a JavaScript of JSON a file to specify configuration information. This can be in the form of an `jest.config.js` in your root or a `jest` field in your package.json file, both of which easy-scripts will look for and read automatically. You can also specify a configuration file in the command line script itself, `npx easy-scripts test --config=path/to/some/config.js`.

_Example of a config that extends easy-scripts built in babelrc.js:_

```
{
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    },
    "preset": "./node_modules/easy-scripts/dist/config/jest.config.js"
}
```

### Typescript support

_Example of a config that extends easy-scripts built in tsconfig.json:_

```
{
  "extends": "./node_modules/easy-scripts/dist/config/tsconfig.json",
  "include": ["src", "types"],
  "compilerOptions": {
    "declaration": true,
    "declarationDir": "dist"
  }
}
```

### Husky and commitlint support

`npx easy-scripts commitlint`

To enable CI preparation mode add the follow husky config to your package.json. Your commit message will be linted to ensure that it is semantically correct. Tests and linting rules will also be run on your changed files. It is very quick and you will hardly notice it running.

```
  "husky": {
    "hooks": {
      "commit-msg": "easy-scripts commitlint -e $HUSKY_GIT_PARAMS",
      "pre-commit": "easy-scripts pre-commit",
      "post-rewrite": "easy-scripts pre-commit"
    }
  },
```

Use a JavaScript, JSON or YAML file to specify or extend the built it commitlint config. This can be in the form of an `commitlint.config.js`,`.commitlintrc.js`,`.commitlintrc.json` or `commitlintrc.yml` file in your root, both of which `easy-scripts` will look for and read automatically.

_Example of a `.commitlint.config.js` root config that extends easy-scripts built in commitlint.config.js:_

```
{
  const  commitlintConfig = require('easy-scripts/dist/config/commitlint.config')
  module.exports = Object.assign(commitlintConfig, {
    ...your own rules here
  })
}
```

### CI support

`npx easy-scripts validate`

To validate that ALL of your jest tests pass, linting and prettier rules are satisfied and your project successfully builds when calling `yarn build` please add `npx easy-scripts validate` to your CI config file. You can add an npm script to your package.json, `"validate":"yarn easy-scripts validate"

## Inspiration

This is inspired by `react-scripts`.

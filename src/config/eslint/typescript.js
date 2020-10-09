module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
    "prettier/@typescript-eslint",
  ],
  rules: {
    "@typescript-eslint/explicit-member-accessibility": 0,
    "@typescript-eslint/explicit-function-return-type": 0,
    "@typescript-eslint/explicit-module-boundary-types": 0,
    "@typescript-eslint/no-explicit-any": 1,
    "@typescript-eslint/ban-ts-ignore": 0,
    "@typescript-eslint/no-empty-function": 0,
    "@typescript-eslint/no-inferrable-types": 0,
    "@typescript-eslint/no-unused-vars": 2,
    "@typescript-eslint/no-unused-expressions": 2,
    "@typescript-eslint/no-use-before-define": 1,
    "@typescript-eslint/no-require-imports": 0,
  },
  overrides: [
    {
      files: ["*.js", "*.jsx"],
      rules: {
        "@typescript-eslint/no-var-requires": 0,
        "@typescript-eslint/no-unused-vars": 0,
        "@typescript-eslint/no-use-before-define": 0,
      },
    },
  ],
};

const { packageManager } = require("../jsonate/");
const { ifTypescriptProject } = require("../utils");

const { ifAnyDep } = packageManager();
module.exports = {
  extends: [
    require.resolve("./eslint"),
    require.resolve("./eslint/jest"),
    ifTypescriptProject(require.resolve("./eslint/typescript")),
    ifAnyDep("react", require.resolve("./eslint/jsx-a11y")),
    ifAnyDep("react", require.resolve("./eslint/react")),
  ].filter(Boolean),
  rules: {
    "import/no-unresolved": ifTypescriptProject("off", "error"),
  },
};

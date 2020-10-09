const prompts = require("prompts");
const { execCmd, print } = require("../utils");
const { packageManager } = require("../jsonate");

async function installTypescriptDep() {
  const packageJSON = packageManager();
  print("WARNING: Missing typescript dependency!");
  const { shouldInstall } = await prompts({
    type: "confirm",
    name: "shouldInstall",
    message: "Install typescript?",
    initial: true,
  });
  if (!shouldInstall) return false;
  await execCmd("yarn add -D typescript");
  // We need to reload the package.json into the packageManager since yarn
  // changed it
  packageJSON.reload();
  return true;
}

module.exports = { installTypescriptDep };

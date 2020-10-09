const path = require("path");
const spawn = require("cross-spawn");
const { packageManager } = require("../jsonate/");

const { hasProp: hasPkgProp } = packageManager();
const { isOptedIn, hasFile, resolveBin } = require("../utils");

const here = (p) => path.join(__dirname, p);
const hereRelative = (p) => here(p).replace(process.cwd(), ".");

const args = process.argv.slice(2);

const useBuiltInConfig =
  !args.includes("--config") &&
  !hasFile(".lintstagedrc") &&
  !hasFile("lint-staged.config.js") &&
  !hasPkgProp("lint-staged");

const config = useBuiltInConfig
  ? ["--config", hereRelative("../config/lintstagedrc.js")]
  : [];

const lintStagedResult = spawn.sync(
  resolveBin("lint-staged"),
  [...config, ...args],
  {
    stdio: "inherit",
  }
);

if (lintStagedResult.status !== 0 || !isOptedIn("pre-commit")) {
  // eslint-disable-next-line no-process-exit
  process.exit(lintStagedResult.status);
} else {
  const validateResult = spawn.sync("npm", ["run", "validate"], {
    stdio: "inherit",
  });
  // eslint-disable-next-line no-process-exit
  process.exit(validateResult.status);
}

const spawn = require("cross-spawn");
const { parseEnv, resolveBin, getConcurrentlyArgs } = require("../utils");
const { packageManager } = require("../jsonate/");

const { ifScript } = packageManager();

// pre-commit runs linting and tests on the relevant files
// so those scripts don't need to be run if we're running
// this in the context of a pre-commit hook
const preCommit = parseEnv("SCRIPTS_PRE-COMMIT", false);

const validateScripts = process.argv[2];

const useDefaultScripts = typeof validateScripts !== "string";

const scripts = useDefaultScripts
  ? {
      build: ifScript("build", "yarn build"),
      lint: preCommit ? null : ifScript("lint", "yarn lint --quiet"),
      stylelint: preCommit
        ? null
        : ifScript("stylelint", "yarn stylelint --quiet"),
      test: preCommit
        ? null
        : ifScript("test", "yarn test --silent --all --coverage"),
    }
  : validateScripts.split(",").reduce((scriptsToRun, name) => {
      scriptsToRun[name] = `yarn ${name} --silent`;
      return scriptsToRun;
    }, {});

const result = spawn.sync(
  resolveBin("concurrently"),
  getConcurrentlyArgs(scripts),
  {
    stdio: "inherit",
  }
);

// eslint-disable-next-line no-process-exit
process.exit(result.status);

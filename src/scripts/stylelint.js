const spawn = require("cross-spawn");
const yargsParser = require("yargs-parser");

const {
  resolveBin,
  fromConfigs,
  useBuiltInStyleLintConfig,
  useBuiltInStyleLintIgnore,
  print,
} = require("../utils");

function lint() {
  try {
    let args = process.argv.slice(2);
    const parsedArgs = yargsParser(args);

    const useBuiltinConfig = useBuiltInStyleLintConfig(args);

    const config = useBuiltinConfig
      ? ["--config", fromConfigs("stylelint.config.js")]
      : [];

    const useBuiltinIgnore = useBuiltInStyleLintIgnore(args);

    const ignore = useBuiltinIgnore
      ? ["--ignore-path", fromConfigs("stylelintignore")]
      : [];

    const filesGiven = parsedArgs._.length > 0;

    const filesToApply = filesGiven
      ? []
      : ["**/*.ts", "**/*.tsx", "**/*.css", "**/*.js", "**/*.jsx"];

    if (filesGiven) {
      // we need to take all the flag-less arguments (the files that should be linted)
      // and filter out the ones that aren't js files. Otherwise json or css files
      // may be passed through
      args = args.filter(
        (a) =>
          !parsedArgs._.includes(a) ||
          a.endsWith(".js") ||
          a.endsWith(".jsx") ||
          a.endsWith(".ts") ||
          a.endsWith(".css") ||
          a.endsWith(".tsx")
      );
    }

    const result = spawn.sync(
      resolveBin("stylelint"),
      [...config, ...ignore, ...args, ...filesToApply],
      { stdio: "inherit" }
    );

    if (result.status > 0) {
      // eslint-disable-next-line no-useless-escape
      print(`Stylelint FAILED ¯\_(ツ)_/¯`);
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
    // We have to process exit here for lintstaged
    // eslint-disable-next-line no-process-exit
    process.exit(result.status);
  } catch (error) {
    // eslint-disable-next-line no-useless-escape
    print(`Stylelint FAILED ¯\_(ツ)_/¯`);
    print(error);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
}

(async () => {
  await lint();
})();

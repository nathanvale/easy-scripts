//TODO: imporve test converage
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const mkdirp = require("mkdirp");
const rimraf = require("rimraf");
const which = require("which");
const arrify = require("arrify");
const { packageManager } = require("./jsonate");

function getAppDirectory() {
  const { getState: getPkgState } = packageManager();
  return path.dirname(getPkgState().configPath);
}

function resolveNdvScripts() {
  const { getProp: getPkgProp } = packageManager();
  if (getPkgProp("name") === "easy-scripts") {
    return require.resolve("./").replace(process.cwd(), ".");
  }
  return resolveBin("easy-scripts");
}

// eslint-disable-next-line complexity
function resolveBin(
  modName,
  { executable = modName, cwd = process.cwd() } = {}
) {
  let pathFromWhich;
  try {
    pathFromWhich = fs.realpathSync(which.sync(executable));
  } catch (_error) {
    // ignore _error
  }
  try {
    const modPkgPath = require.resolve(`${modName}/package.json`);
    const modPkgDir = path.dirname(modPkgPath);
    const { bin } = require(modPkgPath);
    const binPath = typeof bin === "string" ? bin : bin[executable];
    const fullPathToBin = path.join(modPkgDir, binPath);
    if (fullPathToBin === pathFromWhich) {
      return executable;
    }
    return fullPathToBin.replace(cwd, ".");
  } catch (error) {
    if (pathFromWhich) {
      return executable;
    }
    throw error;
  }
}

const fromRoot = (...p) => path.join(getAppDirectory(), ...p);
const hasFile = (...p) => fs.existsSync(fromRoot(...p));
const ifFile = (files, t = true, f = false) =>
  arrify(files).some((file) => hasFile(file)) ? t : f;

function parseEnv(name, def) {
  if (envIsSet(name)) {
    try {
      return JSON.parse(process.env[name]);
    } catch (err) {
      return process.env[name];
    }
  }
  return def;
}

function envIsSet(name) {
  return (
    process.env.hasOwnProperty(name) &&
    process.env[name] &&
    process.env[name] !== "undefined"
  );
}

function getConcurrentlyArgs(scripts, { killOthers = true } = {}) {
  const colors = [
    "bgBlue",
    "bgGreen",
    "bgMagenta",
    "bgCyan",
    "bgWhite",
    "bgRed",
    "bgBlack",
    "bgYellow",
  ];
  scripts = Object.entries(scripts).reduce((all, [name, script]) => {
    if (script) {
      all[name] = script;
    }
    return all;
  }, {});
  const prefixColors = Object.keys(scripts)
    .reduce(
      (pColors, _s, i) =>
        pColors.concat([`${colors[i % colors.length]}.bold.reset`]),
      []
    )
    .join(",");

  // prettier-ignore
  return [
    killOthers ? "--kill-others-on-fail" : null,
    "--prefix", "[{name}]",
    "--names", Object.keys(scripts).join(","),
    "--prefix-colors", prefixColors,
    ...Object.values(scripts).map(s => JSON.stringify(s)), // stringify escapes quotes ✨
  ].filter(Boolean)
}

function isOptedOut(key, t = true, f = false) {
  if (!fs.existsSync(fromRoot(".opt-out"))) {
    return f;
  }
  const contents = fs.readFileSync(fromRoot(".opt-out"), "utf-8");
  return contents.includes(key) ? t : f;
}

function isOptedIn(key, t = true, f = false) {
  if (!fs.existsSync(fromRoot(".opt-in"))) {
    return f;
  }
  const contents = fs.readFileSync(fromRoot(".opt-in"), "utf-8");
  return contents.includes(key) ? t : f;
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

function writeExtraEntry(name, { cjs, esm }, clean = true) {
  if (clean) {
    rimraf.sync(fromRoot(name));
  }
  mkdirp.sync(fromRoot(name));

  const pkgJson = fromRoot(`${name}/package.json`);
  const entryDir = fromRoot(name);

  fs.writeFileSync(
    pkgJson,
    JSON.stringify(
      {
        main: path.relative(entryDir, cjs),
        "jsnext:main": path.relative(entryDir, esm),
        module: path.relative(entryDir, esm),
      },
      null,
      2
    )
  );
}

//TODO: should this throw an error?
//TODO: add this to jsonate
function createConfig(p, c) {
  fs.writeFileSync(p, c, (err) => {
    if (err) {
      print(err);
    }
    print("The file was saved!");
  });
}

function execCmd(command, options = {}, silent = true) {
  if (!silent) {
    //TODO: use print to colwidth here .... DONE
    print(command);
  }
  return exec(command, options)
    .then((response) => response.stdout)
    .catch((error) => {
      if (error.stderr === "") return error.stdout;
      throw error;
    });
}

function wait(timeout) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), timeout);
  });
}

function print(message) {
  // eslint-disable-next-line no-console
  console.info(message);
}

function useBuiltInBabelConfig(args) {
  const { hasProp: hasPkgProp } = packageManager();
  return (
    isDogfooding() ||
    (!args.includes("--presets") &&
      !hasFile(".babelrc") &&
      !hasFile(".babelrc.js") &&
      !hasFile("babel.config.js") &&
      !hasPkgProp("babel"))
  );
}

function useBuiltInEslintConfig(args) {
  const { hasProp: hasPkgProp } = packageManager();
  return (
    isDogfooding() ||
    (!args.includes("--config") &&
      !hasFile(".eslintrc") &&
      !hasFile(".eslintrc.js") &&
      !hasPkgProp("eslintConfig"))
  );
}

function useBuiltInStyleLintConfig(args) {
  const { hasProp: hasPkgProp } = packageManager();
  return (
    isDogfooding() ||
    (!args.includes("--config") &&
      !hasFile(".stylelintrc") &&
      !hasFile("stylelint.config.js") &&
      !hasPkgProp("stylelint"))
  );
}

function useBuiltInStyleLintIgnore() {
  return isDogfooding() || !hasFile(".stylelintignore");
}

function useBuiltInEslintIgnore(args) {
  const { hasProp: hasPkgProp } = packageManager();
  return (
    isDogfooding() ||
    (!args.includes("--ignore-path") &&
      !hasFile(".eslintignore") &&
      !hasPkgProp("eslintIgnore"))
  );
}

function useBuiltInWebpackConfig(args) {
  return (
    isDogfooding() ||
    (!args.includes("--config") && !hasFile("webpack.config.js"))
  );
}

function fromConfigs(p) {
  return path.join(__dirname, "./config/", p);
}

function hasTypescriptFiles() {
  return (
    !isDogfooding() &&
    glob.sync(fromRoot("!(node_modules)/**/*.{ts,tsx}")).length > 0
  );
}

function isDogfooding() {
  const { getProp: getPkgProp } = packageManager();
  return getPkgProp("name") === "easy-scripts";
}

function ifTypescriptProject(t = true, f = false) {
  return hasTypescriptFiles() ? t : f;
}

function printStage(stage) {
  // eslint-disable-next-line no-console
  console.info(`\n===> ${stage} <===\n`);
}

module.exports = {
  createConfig,
  envIsSet,
  execCmd,
  fromConfigs,
  fromRoot,
  getAppDirectory,
  getConcurrentlyArgs,
  hasFile,
  hasTypescriptFiles,
  ifFile,
  isDogfooding,
  ifTypescriptProject,
  isOptedIn,
  isOptedOut,
  parseEnv,
  print,
  printStage,
  resolveBin,
  resolveNdvScripts,
  uniq,
  useBuiltInEslintConfig,
  useBuiltInEslintIgnore,
  useBuiltInStyleLintConfig,
  useBuiltInBabelConfig,
  useBuiltInWebpackConfig,
  useBuiltInStyleLintIgnore,
  wait,
  writeExtraEntry,
};

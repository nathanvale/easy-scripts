const spawn = require("cross-spawn");
const rimraf = require("rimraf");
const {
  fromRoot,
  fromConfigs,
  resolveBin,
  useBuiltInBabelConfig,
} = require("../../utils");

function build() {
  const args = process.argv.slice(2).filter((arg) => arg !== "--monorepo");
  const useBuiltinConfig = useBuiltInBabelConfig(args);

  const config = useBuiltinConfig
    ? ["--presets", fromConfigs("babelrc.js")]
    : [];
  const builtInIgnore = "**/__tests__/**,**/__mocks__/**";

  const ignore = args.includes("--ignore") ? [] : ["--ignore", builtInIgnore];

  const copyFiles = args.includes("--no-copy-files") ? [] : ["--copy-files"];
  const useSpecifiedOutDir = args.includes("--out-dir");
  const outDir = useSpecifiedOutDir ? [] : ["--out-dir", "dist"];

  if (!useSpecifiedOutDir && !args.includes("--no-clean")) {
    rimraf.sync(fromRoot("dist"));
  }

  const finalArgs = [
    ...outDir,
    ...config,
    ...copyFiles,
    ...ignore,
    "src",
  ].concat(args);

  const result = spawn.sync(
    resolveBin("@babel/cli", { executable: "babel" }),
    finalArgs,
    {
      stdio: "inherit",
    }
  );

  return result;
}

module.exports = {
  build,
};

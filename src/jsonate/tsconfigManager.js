const shared = require("./shared").shared;

const tsConfigManager = ({
  filename = "tsconfig.json",
  cwd = process.cwd(),
  initialState = {},
} = {}) =>
  shared({
    initialState,
    configFn: (props) => {
      const { getState } = props;
      if (!getState().isLoaded) {
        props.load(filename, { cwd });
      }
      const getCompilerOption = (compilerOption) =>
        props.getSubProp("compilerOptions")(compilerOption);
      const getFiles = () => props.getProp("files");
      const hasCompilerOption = (compilerOption) =>
        props.hasSubProp("compilerOptions")(compilerOption);
      return {
        ...props,
        getCompilerOption,
        hasCompilerOption,
        getFiles,
      };
    },
  });

module.exports = {
  tsConfigManager,
};

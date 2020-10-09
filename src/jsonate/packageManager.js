const fs = require("fs");
const arrify = require("arrify");
const readPkgUp = require("read-pkg-up");
const shared = require("./shared").shared;

const packageManager = ({ cwd = process.cwd(), initialState = {} } = {}) =>
  shared({
    initialState,
    configFn: (props) => {
      const { hasSubProp, ifSubProp, setState, getState } = props;
      if (!getState().isLoaded) {
        const { pkg: config, path: configPath } = readPkgUp.sync({
          cwd: fs.realpathSync(cwd),
        });
        setState(() => ({
          filename: "package.json",
          config,
          configPath,
          isLoaded: true,
        }));
      }
      const hasAnyDep = (args) =>
        [
          hasSubProp("dependencies"),
          hasSubProp("devDependencies"),
          hasSubProp("peerDependencies"),
        ].some((fn) => fn(args));

      const hasDep = (dep) => hasSubProp("dependencies")(dep);

      const hasDevDep = (devDep) => hasSubProp("devDependencies")(devDep);

      const hasPeerDep = (peerDep) => hasSubProp("peerDependencies")(peerDep);

      const hasScript = (script) => hasSubProp("scripts")(script);

      const ifAnyDep = (deps, t, f) => (hasAnyDep(arrify(deps)) ? t : f);

      const ifDep = ifSubProp("dependencies");

      const ifDevDep = ifSubProp("devDependencies");

      const ifPeerDep = ifSubProp("peerDependencies");

      const ifScript = ifSubProp("scripts");

      return {
        ...props,
        hasAnyDep,
        hasDep,
        hasDevDep,
        hasPeerDep,
        hasScript,
        ifAnyDep,
        ifDep,
        ifDevDep,
        ifPeerDep,
        ifScript,
      };
    },
  });

module.exports = {
  packageManager,
};

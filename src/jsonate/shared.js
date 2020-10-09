const fs = require("fs");
const arrify = require("arrify");
const get = require("lodash.get");
const has = require("lodash.has");
const findUp = require("find-up");
const parseJson = require("parse-json");

function shared({ configFn, initialState }) {
  let state = {
    config: undefined,
    configPath: undefined,
    filename: undefined,
    isLoaded: false,
    ...initialState,
  };
  const setState = (fn) => (state = { ...state, ...fn(state) });
  const getState = () => state;

  const load = (filename, { cwd = process.cwd() } = {}) => {
    if (!filename) throw new Error("A filename must be passed in!");
    const configPath = findUp.sync(filename, { cwd });
    const config = parseJson(fs.readFileSync(configPath, "utf8"));
    setState(() => ({ configPath, config, isLoaded: true, filename }));
  };

  const reload = () => {
    if (!state.configPath) throw new Error(`Please load a config file first!`);
    setState(() => ({ isLoaded: false }));
    const config = parseJson(fs.readFileSync(state.configPath, "utf8"));
    setState(() => ({ config, isLoaded: true }));
  };

  const getProp = (prop) => get(state.config, `${prop}`);

  const getSubProp = (prop) => (subProp) =>
    get(state.config, `${prop}.${subProp}`);

  const hasProp = (props) => {
    if (!state.config) {
      throw new Error("Please load a config file first!");
    }
    return arrify(props).some((prop) => has(state.config, prop));
  };

  const hasSubProp = (prop) => (props) =>
    hasProp(arrify(props).map((p) => `${prop}.${p}`));

  const ifSubProp = (prop) => (props, t, f) =>
    hasSubProp(prop)(props) ? t : f;

  //TODO: look at freeezing this returned object
  return configFn({
    getProp,
    getState,
    getSubProp,
    hasProp,
    hasSubProp,
    ifSubProp,
    load,
    reload,
    setState,
  });
}

module.exports = {
  shared,
};

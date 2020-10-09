/* eslint-disable jest/expect-expect */
describe("config", () => {
  test("requiring some files does not blow up", () => {
    require("../babel-transform");
    require("../babelrc");
    require("../eslintrc");
    require("../commitlint.config");
    require("../jest.config");
    require("../jest.monorepo.config");
    require("../lintstagedrc");
    require("../rollup.config");
    require("../tsconfig.json");
    require("../wallaby.config.js");
    require("../wallaby.monorepo.config.js");
    require("../").getRollupConfig();
  });
});

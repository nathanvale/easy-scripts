const spawn = require("cross-spawn");
const { fromRoot, resolveBin } = require("../utils");

function openCoverage() {
  try {
    const args = process.argv.slice(2);
    const path = [fromRoot("/coverage/lcov-report/index.html")];
    spawn.sync(resolveBin("open"), [...path, ...args], {
      stdio: "inherit",
    });
    // eslint-disable-next-line no-empty
  } catch (error) {}
}

(async () => {
  await openCoverage();
})();

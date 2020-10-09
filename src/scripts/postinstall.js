/* eslint-disable no-console */
const execFileSync = require("child_process").execFileSync;
const chalk = require("chalk");
const semver = require("semver");
require("console.table");
const { packageManager } = require("../jsonate/");

const { getProp, hasProp } = packageManager();

function printHint(str) {
  console.log(`${chalk.bold.blue("Hint: ")} ${str}`);
}

const exec = (command, args, verbose) => {
  // eslint-disable-next-line babel/no-unused-expressions
  verbose && console.log(`> ${[command].concat(args).join(" ")}\n`);
  const options = {
    cwd: process.cwd(),
    env: process.env,
    stdio: "pipe",
    encoding: "utf-8",
  };
  const result = execFileSync(command, args, options);

  return result;
};

const execGitCmd = (args) => {
  const a = exec("git", args);
  return a.trim().toString().split("\n");
};

async function getLeaderBoard({ days = 60 } = {}) {
  const args = [
    "shortlog",
    "-s",
    "-n",
    "-e",
    "--all",
    "--since",
    `${days}.days`,
    "--no-merges",
  ];
  const authors = await execGitCmd(args);
  return authors;
}

function formatShortLog(authors) {
  const excludedAuthors = {
    "<mirsajjad.mehdi@originenergy.com.au>": true,
    "<jenkins@originenergy.com.au>": true,
    "<jenkins@origin.com.au>": true,
    "<semantic-release-bot@martynus.net>": true,
  };

  // git shortlog return no authors
  if (authors.length === 1 && authors[0] === "") {
    return [];
  } else {
    return (
      authors
        // transform the git shortlog authors returned into a json array of objects
        .map((author) => {
          const element = author.trim().split("\t");
          // pluck out the email address
          // eslint-disable-next-line no-useless-escape
          const regex = /\<(.*?)\>/g;
          const email = element[1].match(regex)[0];
          const name = element[1].replace(email, "").trim();
          return {
            name,
            email,
          };
        })
        // filter out dev ops and ci git users
        .filter((author) => !excludedAuthors.hasOwnProperty(author.email))
        // only show the top 3
        .slice(0, 3)
    );
  }
}

function print(authors = [], period = "unknown period") {
  // eslint-disable-next-line babel/no-unused-expressions
  authors.length > 0 &&
    console.log(chalk.bold(`Top contributors in the last ${period}:\n`));
  // eslint-disable-next-line babel/no-unused-expressions
  authors.length > 0 && console.table(authors);
}

async function printLeaderBoard() {
  const last7Days = formatShortLog(await getLeaderBoard({ days: 7 }));
  const last30Days = formatShortLog(await getLeaderBoard({ days: 30 }));
  const last6Months = formatShortLog(await getLeaderBoard({ days: 182 }));

  console.log(chalk.blue.bold("Questions? Try asking…\n\n"));

  print(last7Days, "week");
  print(last30Days, "month");
  print(last6Months, "6 months");

  return { last7Days, last30Days, last6Months };
}
exports.printLeaderBoard = printLeaderBoard;
exports.formatShortLog = formatShortLog;
(async () => {
  if (hasProp("engines")) {
    const engines = getProp("engines");
    const version = engines.node;
    if (!semver.satisfies(process.version, version)) {
      throw new Error(
        `The current node version${process.version} does not satisfy the required version ${version} .`
      );
    }
  }
  console.log("");
  console.log("");
  await printLeaderBoard();
  printHint(`The README.MD is very helpful. Happy hacking :)`);
  console.log("");
  console.log("");
})();

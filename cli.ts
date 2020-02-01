#!/usr/bin/env node

import minimist from "minimist";
import inquirer from "inquirer";
import autocomplete from "inquirer-autocomplete-prompt";
import chalk from "chalk";

const getConfigFrom = require("./src/config/get-config-from");
const { version } = require("./package.json");
const Papyrus = require("./src/index");

inquirer.registerPrompt("autocomplete", autocomplete);

let config = {
  debug: true
};

function logger(context, ...log) {
  /* eslint-disable-next-line no-console */
  console.log(logger.contextMap[context] || context, ...log);
}
logger.contextMap = {
  preview: "🔎"
};
logger.color = chalk;

async function runner() {
  /* eslint-disable-next-line no-console */
  console.log(`📜 ${chalk.bold(`Papyrus v${version}`)}`);

  const argvConfig = await getConfigFrom(minimist(process.argv.slice(2)));

  const papyrus = new Papyrus(argvConfig, inquirer, logger);
  await papyrus.init();
  /* eslint-disable-next-line prefer-destructuring */
  config = papyrus.config;

  await papyrus.chooseTemplate();
  await papyrus.run();
}

runner().catch(err => {
  /* eslint-disable-next-line no-console */
  console.error(
    `🔥${config.debug ? chalk.red(` ${err.name}`) : ""} ${chalk.yellow(
      err.message
    )}`
  );
  if (config.debug) {
    /* eslint-disable-next-line no-console */
    console.debug(
      err.stack
        .split("\n")
        .splice(1)
        .join("\n")
    );
  }
  process.exit(err.exitCode || 1);
});

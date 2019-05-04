const path = require('path')
const chalk = require('chalk');

const getAbsolutePath = (filepath, {relativeTo=undefined}={}) => {
  if (filepath[0] === '~') {
    return path.join(process.env.HOME, filepath.slice(1));
  }
  if (path.isAbsolute(filepath)) {
    return filepath;
  }
  if (relativeTo) {
    if (!path.isAbsolute) {
      console.error(`ERROR. Provided path ${relativeTo} must be absolute.`);
    }
    return path.join(relativeTo, filepath)
  }
  return path.join(__dirname, "..", filepath)
}

const fatal = (msg) => {
  console.log(chalk.redBright(`[FATAL] ${msg}`));
  process.exit(2);
}
const verbose = (msg) => {
  if (global.VERBOSE) {
    console.log(chalk.greenBright(`[verbose]\t${msg}`));
  }
};
const log = (msg) => {
  console.log(chalk.blueBright(msg));
};
const warn = (msg) => {
  console.warn(chalk.yellowBright(`[warning]\t${msg}`));
};

const sleep = (ms) => new Promise((resolve) =>
  setTimeout(resolve, ms)
);


const prettyPath = (path) => {
  if (path.split("/").length > 3) {
      return `.../${path.split("/").slice(-3).join("/")}`;
  }
  return path;
}


module.exports = {
  getAbsolutePath,
  sleep,
  prettyPath,
  fatal,
  log,
  warn,
  verbose
};

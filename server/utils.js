const path = require('path')
const fs = require("fs");
const chalk = require('chalk');

/**
 * Appends a `/` to the end of a path if not there
 * @param filepath
 * @returns {string}
 */
const normalizePath = (filepath) => {
  return `${filepath}${filepath.endsWith('/')? "" : "/"}`;
};

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
};

const deleteFolderRecursive = function(pathToRm) {
  if (fs.existsSync(pathToRm)) {
    fs.readdirSync(pathToRm).forEach(function(file, index){
      let curPath = path.join(pathToRm, file);
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(pathToRm);
  }
};

const fatal = (msg) => {
  console.log(chalk.redBright(`[FATAL] ${msg}`));
  process.exit(2);
};

const verbose = (msg) => {
  if (global.VERBOSE) {
    console.log(chalk.green(`[verbose]\t${msg}`));
  }
};

const log = (msg) => {
  console.log(chalk.blue(msg));
};

const warn = (msg) => {
  console.warn(chalk.yellow(`[warning]\t${msg}`));
};

const sleep = (ms) => new Promise((resolve) =>
  setTimeout(resolve, ms)
);


const prettyPath = (path) => {
  if (path.split("/").length > 3) {
      return `.../${path.split("/").slice(-3).join("/")}`;
  }
  return path;
};


module.exports = {
  normalizePath,
  getAbsolutePath,
  sleep,
  prettyPath,
  fatal,
  log,
  warn,
  verbose,
  deleteFolderRecursive
};

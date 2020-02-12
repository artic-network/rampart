/*
 * Copyright (c) 2019 ARTIC Network http://artic.network
 * https://github.com/artic-network/rampart
 *
 * This file is part of RAMPART. RAMPART is free software: you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version. RAMPART is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 * See the GNU General Public License for more details. You should have received a copy of the GNU General Public License
 * along with RAMPART. If not, see <http://www.gnu.org/licenses/>.
 *
 */

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
    if (!path.isAbsolute(relativeTo)) {
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
  console.error(chalk.redBright(`[FATAL]    ${msg}`));
  process.exit(2);
};

const verbose = (caller, msg) => {
  if (global.VERBOSE) {
    console.log(chalk.green(`[verbose]  ${`[${caller}]`.padEnd(25)}${msg}`));
  }
};

const log = (msg) => {
  console.log(chalk.blue(msg));
};

const warn = (msg) => {
  console.warn(chalk.yellow(`[warning]  ${msg}`));
};

const sleep = (ms) => new Promise((resolve) =>
  setTimeout(resolve, ms)
);

const trace = (err) => {
    if (global.VERBOSE) {
        console.trace(err);
    }
}

const prettyPath = (path) => {
  if (path.split("/").length > 3) {
      return `.../${path.split("/").slice(-3).join("/")}`;
  }
  return path;
};


function ensurePathExists(path, {make=false}={}) {
  if (!fs.existsSync(path)) {
      if (make) {
          log(`Creating path ${path}`);
          fs.mkdirSync(`${path}`, {recursive: true})
      } else {
          throw new Error(`ERROR. Path ${path} doesn't exist.`);
      }
  }
}

function getProtocolsPath() {
    return path.join(__dirname, "..", "protocols");
}

module.exports = {
  normalizePath,
  getAbsolutePath,
  sleep,
  prettyPath,
  fatal,
  log,
  warn,
  verbose,
  trace,
  deleteFolderRecursive,
  ensurePathExists,
  getProtocolsPath
};

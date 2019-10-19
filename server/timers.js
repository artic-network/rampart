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

const chalk = require('chalk');
const { performance } = require('perf_hooks');
const { verbose, log, warn } = require("./utils");

const startTwiceError = (name) => {
  warn(chalk.white.bgRedBright("Race condition bug! Perf. timer", name, "started when it was already running."));
};
const endBeforeStartError = (name) => {
  warn(chalk.white.bgRedBright("Race condition bug! Perf. timer", name, "finished before it was started."));
};

const dbsingle = {};


const timerStart = (name) => {
  if (!dbsingle.hasOwnProperty(name)) {
    dbsingle[name] = [false, 0, 0];
  }
  if (dbsingle[name][0] !== false) {
    startTwiceError(name); return;
  }
  dbsingle[name][0] = performance.now();
};

const timerEnd = (name) => {
  if (dbsingle.hasOwnProperty(name) && dbsingle[name][0] !== false) {
    const thisTook = parseInt(performance.now() - dbsingle[name][0], 10);
    dbsingle[name][0] = false;
    dbsingle[name][1]++;
    dbsingle[name][2] += thisTook;
    const msg = ` #${dbsingle[name][1]} time: ${thisTook}ms. average: ${parseInt(dbsingle[name][2] / dbsingle[name][1], 10)}ms.`;
    verbose(`Timer ${name}`, (thisTook > 20 ? chalk.black.bgYellowBright(msg): chalk.black.bgGreenBright(msg)));
  } else {
    endBeforeStartError(name);
  }
};

module.exports = {
  timerStart,
  timerEnd
};

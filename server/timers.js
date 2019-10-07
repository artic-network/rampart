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

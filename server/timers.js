const chalk = require('chalk');
const { performance } = require('perf_hooks');

const startTwiceError = (name) => {
  console.log(chalk.white.bgRedBright("Race condition bug! Perf. timer", name, "started when it was already running."));
};
const endBeforeStartError = (name) => {
  console.log(chalk.white.bgRedBright("Race condition bug! Perf. timer", name, "finished before it was started."));
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
    const msg = `Timer ${name} (#${dbsingle[name][1]}) took ${thisTook}ms. Average: ${parseInt(dbsingle[name][2] / dbsingle[name][1], 10)}ms.`;
    if (thisTook > 20) {
      console.log(chalk.black.bgMagentaBright(msg));
    } else {
      console.log(chalk.black.bgWhite(msg));
    }
  } else {
    endBeforeStartError(name);
  }
};

module.exports = {
  timerStart,
  timerEnd
};

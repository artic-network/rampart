const chokidar = require('chokidar');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { sleep } = require('./utils');

const newFastqFileHandler = (newfile, details) => {
  if (!newfile.endsWith(".fastq")) return;
  try {
    const basename = path.basename(newfile)
    if (global.haveBeenSeen.has(basename)) {
      console.log(chalk.cyan(`chokidar ignoring ${basename} as it's already been processed`));
      return;
    }
    console.log(chalk.cyan(`WATCHER: new basecalled file => adding "${basename}" to demux queue.`));
    global.demuxQueue.push(newfile);
    global.haveBeenSeen.add(basename);

  } catch (err) {
    console.log(err);
  }

}

const startWatcher = () => {
  const watcher = chokidar.watch(global.config.basecalledPath, {
    ignored: /(^|[/\\])\../,
    interval: 1000,
    persistent: true,
    depth: 1
  });
  watcher.on("ready", () => {
    console.log(chalk.yellowBright(`Started watching folder ${global.config.basecalledPath}`));
    console.log(chalk.yellowBright(`(basecalled files created here will be demuxed)`));      
    watcher.on("add", newFastqFileHandler);
  });
}

const startGuppyWatcher = async () => {
  if (global.args.startWithDemuxedReads) {
    console.log(chalk.green(`DAEMON: Not watching for guppy files due to --startWithDemuxedReads flag.`));
    return;
  }

  /* overview:
   * we've already scanned the file for pre-existing fastqs and pushed them onto the deque
   * global.haveBeenSeen contains the names of all of these (mainly for debugging purposes)
   * dogfish writes fastqs into this directory in sequential order, i.e.
   * when fastq_<n>.fastq appears, fastq_<n-1>.fastq can be processed
   * We watch for file creation then add the previous fastq to the deque
   */

  while (true) {
    if (fs.existsSync(global.config.basecalledPath)) {
      startWatcher();
      break;
    }
    await sleep(5000);
    console.log("INFO: basecalled directory doesn't yet exist...")
  }

}


module.exports = { startGuppyWatcher }



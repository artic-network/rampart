const chokidar = require('chokidar');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const newFastqFileHandler = (newfile, details) => {
  if (!newfile.endsWith(".fastq")) return;
  try {
    const fastqNum = parseInt(newfile.match(/_(\d+)\.fastq/)[1], 10);
    if (!fastqNum) return; /* 0 */

    const fileToAdd = newfile.replace(`_${fastqNum}.fastq`, `_${fastqNum-1}.fastq`);
    const fileToAddBasename = path.basename(fileToAdd)
    if (global.haveBeenSeen.has(fileToAddBasename)) {
      console.log(chalk.cyan(`chokidar ignoring ${fileToAddBasename} as it's already been processed`));
      return;
    }
    if (!fs.existsSync(fileToAdd)) {
      console.log(chalk.red(`ignoring "${fileToAddBasename}" as it doesn't exist`));
      return;
    }
    console.log(chalk.cyan(`DAEMON: new basecalled file "${path.basename(newfile)}" => adding "${fileToAddBasename}" to demux queue.`));
    global.demuxQueue.push(fileToAdd);
    global.haveBeenSeen.add(fileToAddBasename);

  } catch (err) {
    console.log(err);
  }

}

const startGuppyWatcher = () => {
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

  console.log(chalk.yellowBright(`Started watching folder ${global.config.basecalledPath}`));
  console.log(chalk.yellowBright(`(basecalled files created here will be demuxed)`));

  const watcher = chokidar.watch(global.config.basecalledPath, {
      ignored: /(^|[/\\])\../,
      interval: 1000,
      persistent: true,
      depth: 1
    });
  /* after the initial scan completes attatch the "new file" handler */
  watcher.on("ready", () => {
    watcher.on("add", newFastqFileHandler);
  });

}


module.exports = { startGuppyWatcher }



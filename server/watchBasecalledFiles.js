const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const { sleep, verbose, log } = require('./utils');
const { addToAnnotationQueue } = require("./annotator");

const newFastqFileHandler = (newfile, details) => {
  if (!newfile.endsWith(".fastq")) return;
  try {
    const basename = path.basename(newfile)
    if (global.fastqsSeen.has(basename)) {
      return;
    }
    verbose(`[fastq watcher] new basecalled file => adding "${basename}" to annotation queue.`);
    addToAnnotationQueue(newfile);
    global.fastqsSeen.add(basename);

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
  log(`Started watching folder ${global.config.basecalledPath}`);
  log(`(basecalled files created here will be demuxed)`);
  watcher.on("add", newFastqFileHandler);
}

const startBasecalledFilesWatcher = async () => {

  /* overview:
   * we've already scanned the file for pre-existing fastqs and pushed them onto the deque
   * global.fastqsSeen contains the names of all of these (mainly for debugging purposes)
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
    log("INFO: basecalled directory doesn't yet exist. Checking again in 5s.")
  }

}


module.exports = { startBasecalledFilesWatcher }



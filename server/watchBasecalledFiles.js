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

const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const { sleep, verbose, log } = require('./utils');
const { makeFileSortFunction } = require("./startUp");

const newFastqFileHandler = (newfile) => {
  if (!newfile.endsWith(".fastq")) return;
  try {
    const basename = path.basename(newfile, ".fastq")
    if (global.filesSeen.has(basename)) {
      return;
    }
    verbose("fastq watcher", `new basecalled file => adding "${basename}" to annotation queue.`);

    global.pipelineRunners.annotation.addToQueue({
      input_path: global.config.run.basecalledPath,
      output_path: global.config.run.annotatedPath,
      filename_stem: basename
    });

    global.filesSeen.add(basename);
  } catch (err) {
    console.log(err);
  }
}

const startWatcher = () => {
  let initialScanComplete = false;
  const fastqsAtInitialScan = [];
  const watcher = chokidar.watch(global.config.run.basecalledPath, {
    ignored: /(^|[/\\])\../,
    interval: 1000,
    persistent: true,
    depth: 1
  });
  log(`Scanning folder ${global.config.run.basecalledPath} for FASTQs`);
  log(`(basecalled files which exist here (or are created here by MinKNOW) will be annotated and loaded)\n`);
  watcher.on("add", (filepath) => {
    if (initialScanComplete) {
      newFastqFileHandler(filepath);
    } else {
      if (path.parse(filepath).ext === ".fastq") {
        fastqsAtInitialScan.push(filepath)
      }
    }
  });
  watcher.on('ready', () => {
    const filepathsToBeAnnotated = fastqsAtInitialScan
        .filter((fp) => !global.filesSeen.has(path.basename(fp, ".fastq")))
    log(`Initial scan for FASTQs complete. Found ${fastqsAtInitialScan.length} files, ${filepathsToBeAnnotated.length} of which had not already been annotated.`);
    filepathsToBeAnnotated
      .sort(makeFileSortFunction(".fastq"))
      .forEach((filepath) => newFastqFileHandler(filepath))
    initialScanComplete = true;
    log(`Watching for new files`);
  });
}


/**
 * we've already scanned the file for pre-existing fastqs and pushed them onto the deque
 * global.filesSeen contains the names of all of these (mainly for debugging purposes)
 * guppy writes fastqs into this directory in sequential order, i.e.
 * when fastq_<n>.fastq appears, fastq_<n-1>.fastq can be processed
 * We watch for file creation then add the previous fastq to the deque
 */
const startBasecalledFilesWatcher = async () => {
  while (true) {
    if (fs.existsSync(global.config.run.basecalledPath)) {
      startWatcher();
      break;
    }
    await sleep(5000);
    log("INFO: basecalled directory doesn't yet exist. Checking again in 5s.")
  }
}


module.exports = { startBasecalledFilesWatcher }



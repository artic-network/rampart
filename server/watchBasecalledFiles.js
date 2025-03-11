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
const { sleep, verbose, log, warn } = require('./utils');
const { makeFileSortFunction } = require("./startUp");


const newFastqFileHandler = (fileInfo) => {
  try {
    if (!fileInfo.looksLikeFastq) return;
    if (global.filesSeen.has(fileInfo.filesSeenName)) {
      // This shouldn't happen as FASTQs present at start-up are filtered 
      // against `filesSeen` before being passed to `newFastqFileHandler`
      // Therefore how can a "new" FASTQ already have been seen / annotated?
      warn(`Detected "new" FASTQ ${fileInfo.filesSeenName} which has already been seen!`)
      return;
    }
    verbose("fastq watcher", `new basecalled file => adding "${fileInfo.filesSeenName}" to annotation queue.`);

    global.pipelineRunners.annotation.addToQueue({
      input_path: fileInfo.dir,
      output_path: path.join(global.config.run.annotatedPath, fileInfo.subdir),
      filename_stem: fileInfo.name,
      filename_ext: fileInfo.ext
    });
    global.filesSeen.add(fileInfo.filesSeenName);
  } catch (err) {
    console.log(err);
  }
}

const startWatcher = () => {
  let initialScanComplete = false;
  const fastqsAtInitialScan = [];
  const watcher = chokidar.watch(global.config.run.basecalledPath, {
    usePolling: global.config.run.usePolling,
    ignored: /(^|[/\\])\../,
    persistent: true,
    /* Allow FASTQs to be in nested subdirs 2 deep (e.g. ${basecalldePath}/a/b/*fastq) */
    depth: 2,
    /* We want the `add` event to fire _after_ MinKNOW has written the file */
    awaitWriteFinish: {
      stabilityThreshold: global.config.run.pollingThreshold, // Amount of time in milliseconds for a file size to remain constant before emitting its event.
      pollInterval: 1000        // file size polling interval, in milliseconds.
    }
  });
  log(`Scanning folder ${global.config.run.basecalledPath} for FASTQs`);
  log(`(basecalled files which exist here (or are created here by MinKNOW) will be annotated and loaded)\n`);
  watcher.on("add", (filepath) => {
    const fileInfo = getFileInfo(filepath);
    if (initialScanComplete) {
      newFastqFileHandler(fileInfo);
    } else {
      if (fileInfo.looksLikeFastq) {
        fastqsAtInitialScan.push(fileInfo)
      }
    }
  });
  watcher.on('ready', () => {
    // ready event fires at the end of the initial scan
    const filesToBeAnnotated = fastqsAtInitialScan
      .filter((fileInfo) => !global.filesSeen.has(fileInfo.filesSeenName))
    log(`Initial scan for FASTQs complete. Found ${fastqsAtInitialScan.length} files, ${filesToBeAnnotated.length} of which are unannotated (unprocesed).`);
    if (filesToBeAnnotated.length) {
      filesToBeAnnotated
        .sort(makeFileSortFunction((f) => f.filesSeenName))
        .forEach((fileInfo) => newFastqFileHandler(fileInfo))
    }
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

function getFileInfo(filePath) {
  const pathInfo = path.parse(filePath);
  const ext = pathInfo.ext===".fastq" ? ".fastq" : 
    (pathInfo.ext===".gz" && pathInfo.name.endsWith(".fastq")) ? ".fastq.gz" :
    "unknown";
  const name = pathInfo.base.replace(ext, '');
  const dir = pathInfo.dir;
  const subdir = path.relative(global.config.run.basecalledPath, dir);
  const filesSeenName = path.join(subdir, name);
  return {
    looksLikeFastq: (ext===".fastq" || ext===".fastq.gz"),
    root: pathInfo.root,
    dir,                   /* directory the file is in */
    base: pathInfo.base,   /* basename. Includes extension. This is `name`+`ext` */
    subdir,                /* subdirectory the file is in relative to the basecalledPath */
    filesSeenName,         /* subdirectory + name */
    name,                  /* name (no extension) */
    ext                    /* extension */
  };
}


module.exports = { startBasecalledFilesWatcher }



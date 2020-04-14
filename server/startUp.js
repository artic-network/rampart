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

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { addToParsingQueue } = require("./annotationParser");
const readdir = promisify(fs.readdir);
const { prettyPath, log } = require('./utils');

async function getCSVs(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getCSVs(res) : res;
  }));
  return Array.prototype.concat(...files)
    .filter((f) => f.endsWith('.csv'));
}


// Create a sort function which will take a filename or filepath or similar
// and sort them. It is a generator function, with argument `transform` which
// transforms the provided arguments into a string (basename) to compare.
// We attempt to sort using a numerical field at the end of the basename,
// and if this isn't present then we sort alphabetically
const makeFileSortFunction = (transform) => (a, b) => {
  const aToUse = transform(a);
  const bToUse = transform(b);
  const regex = /(\d+)$/;
  const ai = aToUse.match(regex);
  const bi = bToUse.match(regex);
  if (ai && ai.length > 1 && bi && bi.length > 1) {
      return parseInt(ai[1], 10) - parseInt(bi[1], 10);
  }
  return aToUse.localeCompare(bToUse);
};


const removeExistingAnnotatedCSVs = async () => {
  log(`Clearing CSVs from the annotated folder (${prettyPath(global.config.run.annotatedPath)})`);

  const deleteCSVsRecursive = async (dir) => {
    const dirents = await readdir(dir, { withFileTypes: true })
    for (const dirent of dirents) {
      const res = path.resolve(dir, dirent.name);
      if (dirent.isDirectory()) {
        await deleteCSVsRecursive(res);
      } else {
        fs.unlinkSync(res);
      }
    }
    fs.rmdirSync(dir);
  };

  await deleteCSVsRecursive(global.config.run.annotatedPath);
}

/**
 * Process existing annotated CSVs
 * Adds these (as appropriate, no duplicates) to parsing queues and filesSeen (so no dups)
 */
const processExistingAnnotatedCSVs = async () => {
    const csvs = await getCSVs(global.config.run.annotatedPath)
    const csvTransformFn = (f) => path.relative(global.config.run.annotatedPath, f).replace(/\.csv$/, '');

    const pathsOfAnnotatedCSVs = csvs.sort(makeFileSortFunction(csvTransformFn));
    log(`Found ${pathsOfAnnotatedCSVs.length} annotated CSV files in ${prettyPath(global.config.run.annotatedPath)}. FASTQs with the same filename as these will be ignored.`);
    /* TODO - we could sort these based on time stamps if we wished */
    /* TODO - we could filter these to remove ones without a corresponding FASTQ, but that wouldn't let
    us start from annotated files which may be useful */

    pathsOfAnnotatedCSVs.forEach((f) => {
        addToParsingQueue(f);
        global.filesSeen.add(csvTransformFn(f));
    });
    // console.log("After initial scan, filesSeen:", global.filesSeen)
}

module.exports = {
    removeExistingAnnotatedCSVs,
    processExistingAnnotatedCSVs,
    makeFileSortFunction
};



/* UNUSED CODE SNIPPETS */
/* sort the fastqs via these timestamps and push onto the appropriate deques */
// log(`  * Sorting available basecalled and annotation files based on read times`);
// annotatedCSVs
//     .sort((a, b) => getReadTime(a)>getReadTime(b) ? 1 : -1)
//     .forEach((f) => {
//         addToParsingQueue(f);
//         global.fastqsSeen.add(path.basename(f));
//     });

// testing an output pipeline:
// const { PipelineRunner } = require("./PipelineRunner");
//const binFastaPipeline = new PipelineRunner(name, snakefilePath, configfilePath, configOptions, queue);

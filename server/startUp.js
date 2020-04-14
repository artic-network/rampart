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

const getFilesFromDirectory = async (dir, extension) => {
    let fastqs = (await readdir(dir));
    return fastqs
        .filter((j) => {
            const ext = extension;
            return j.endsWith(`.${ext}`);
        })
        .sort((a, b) => parseInt(a.match(/\d+/), 10) > parseInt(b.match(/\d+/), 10) ? 1 : -1)
        .map((j) => path.join(dir, j));
};


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
  const annotatedFilesToDelete = await readdir(global.config.run.annotatedPath);
  for (const file of annotatedFilesToDelete) {
      const fullPath = path.join(global.config.run.annotatedPath, file);
      if (!fs.lstatSync(fullPath).isDirectory() && fullPath.endsWith(".csv")) {
          fs.unlinkSync(fullPath);
      }
  }
}

/**
 * Process existing datafiles (basecalled FASTQs + annotated CSVs)
 * Adds these (as appropriate, no duplicates) to annotation & parsing queues.
 */
const processExistingAnnotatedCSVs = async () => {
    const csvs = await getFilesFromDirectory(global.config.run.annotatedPath, 'csv');
    const csvTransformFn = (f) => path.basename(f, ".csv");
    const pathsOfAnnotatedCSVs = csvs.sort(makeFileSortFunction(csvTransformFn));

    log(`Found ${pathsOfAnnotatedCSVs.length} annotated CSV files in ${prettyPath(global.config.run.annotatedPath)}. FASTQs with the same filename as these will be ignored.`);
    /* TODO - we could sort these based on time stamps if we wished */
    /* TODO - we could filter these to remove ones without a corresponding FASTQ, but that wouldn't let
    us start from annotated files which may be useful */
    pathsOfAnnotatedCSVs.forEach((f) => {
        addToParsingQueue(f);
        global.filesSeen.add(path.basename(f, '.csv'));
    });
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

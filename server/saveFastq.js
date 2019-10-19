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

const { verbose, log, warn } = require("./utils");
const fs = require('fs')
const path = require('path')


const saveFastq = ({sampleName, outputDirectory, filters}) => {
  log(`saveFastq -> ${outputDirectory}`);

  if (!fs.existsSync(outputDirectory)) {
    warn(`The directory to save FASTQs to -- "${outputDirectory}" doesn't exist`);
    global.io.emit("showWarningMessage", `The directory to save FASTQs to -- "${outputDirectory}" -- doesn't exist`);
    return false;
  }

  global.io.emit("infoMessage", `Saving demuxed FASTQ`);
  const matches = global.datastore.collectFastqFilesAndIndices({sampleName, ...filters});

  for (const [fastqName, fastqLines] of matches) {
    if (!fastqLines.length) return;
    verbose("save fastqs", `Extracting ${fastqLines.length} reads from ${fastqName}`)
    const fastqPath = path.join(global.config.annotatedPath, fastqName);
    if (!fs.existsSync(fastqPath)) {
      warn(`Fastq file ${fastqPath} should exist but doesn't!`)
      global.io.emit("showWarningMessage", `Fastq file ${fastqPath} should exist but doesn't!`);
      return;
    }
    const data = fs.readFileSync(fastqPath, "utf8").split("\n");
    const filteredReadData = [];

    fastqLines.forEach((n) => {
      filteredReadData.push(data[n*4]);
      filteredReadData.push(data[n*4+1]);
      filteredReadData.push(data[n*4+2]);
      filteredReadData.push(data[n*4+3]);
    });

    fs.writeFileSync(path.join(outputDirectory, fastqName), filteredReadData.join("\n"))
  }
  global.io.emit("infoMessage", `Demuxed FASTQs saved`);

}


module.exports = {saveFastq};

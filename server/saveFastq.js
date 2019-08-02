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
  const matches = global.datastore.collectFastqFilesAndIndicies({sampleName, ...filters});

  for (const [fastqName, fastqLines] of matches) {
    if (!fastqLines.length) return;
    verbose(`Extracting ${fastqLines.length} reads from ${fastqName}`)
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

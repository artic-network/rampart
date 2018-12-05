const path = require('path');
const fs = require('fs');
const { promisify } = require('util')
const { mean } = require("d3-array");

const readFile = promisify(fs.readFile);

const getTimeViaSequencingSummary = async (fastq) => {
  const basename = path.basename(fastq)
  const n = parseInt(basename.match(/_(\d+)\.fastq/)[1], 10);
  const summPath = path.join(global.config.basecalledPath, `sequencing_summary_${n}.txt`);
  let data = (await readFile(summPath, 'utf8')).split("\n");
  data.splice(0, 1);
  data = parseInt(mean(data.map((line) => Number(line.split("\t")[4]))), 10);
  return data;
}

const getTimeViaFastq = async (fastq) => {
  let data = (await readFile(fastq, 'utf8'))
    .split("\n")
    .filter((line) =>  line.startsWith('@'))
    .map((header) => header.split(" ")[5].substring(11))
    .map((timestamp) => (new Date(timestamp)).getTime());
  const tRaw = parseInt(mean(data), 10);
  return tRaw;
}


const setReadTime = async (filename) => {
  const basename = path.basename(filename);
  if (global.timeMap.has(basename) || global.epochMap.has(basename)) {
    // console.log("skipping", filename)
    return;
  }
  try {
    const t = await getTimeViaSequencingSummary(filename)
    global.timeMap.set(basename, t);
  } catch (err) {
    // console.log(err.message)
    const tRaw = await getTimeViaFastq(filename)
    if (global.epochMap.has('offset')) {
      global.timeMap.set(basename, parseInt((tRaw - global.epochMap.get("offset"))/1000, 10));
    } else {
      global.epochMap.set(basename, tRaw);
    }
}
  // console.log(global.timeMap);
  // console.log(global.epochMap);
}

module.exports = {
  setReadTime,
  getTimeViaFastq,
  getTimeViaSequencingSummary
}
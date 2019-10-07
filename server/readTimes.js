const path = require('path');
const fs = require('fs');
const { promisify } = require('util')
const { mean } = require("d3-array");
const { verbose } = require("./utils");


/* the node import mechanism effectively creates file-level scope
to store relevent "globals" */
const timeMap = new Map();
const epochMap = new Map();


/**
 * median read time from an annotated CSV
 * @param {Array} annotations
 * @returns unix timestamp in ms
 */
const getTimeFromAnnotatedCSV = (annotations) => {
    return (annotations
        .map((a) => (new Date(a.start_time)).getTime())
        .sort((a, b) => a - b) // numerical sort
    )[Math.floor(annotations.length/2)];
}


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
    .filter((line) => line.startsWith('@'))
    .filter((check) => check.includes('start_time'))
    .map((header) => header.match(/start_time=([\w:-]*)/)[1], 10)
    .map((timestamp) => (new Date(timestamp)).getTime());
  const tRaw = parseInt(mean(data), 10);
  return tRaw;
}


const getReadTime = (filename) => {
  const basename = path.basename(filename);
  if (timeMap.has(basename)) {
    return timeMap.get(basename);
  }
  return undefined;
}

/**
 * Set the times associated with a FASTQ file
 * if the sequencing summary is available, use that
 * (see `getTimeViaSequencingSummary`)
 * 
 * else read the FASTQ itself (see `getTimeViaFastq`).
 * since this way is inaccurate, if the epochMap offset has been set
 * then we can add to the timeMap, else we store the raw
 * result in the epochMap
 * @param {string} filename fastq file 
 */
const setReadTime = async (filename) => {
  const basename = path.basename(filename);
  if (timeMap.has(basename) || epochMap.has(basename)) {
    // console.log("skipping", filename)
    return;
  }
  try {
    const t = await getTimeViaSequencingSummary(filename)
    timeMap.set(basename, t);
  } catch (err) {
    // console.log(err.message)
    const tRaw = await getTimeViaFastq(filename)
    if (epochMap.has('offset')) {
      timeMap.set(basename, parseInt((tRaw - epochMap.get("offset"))/1000, 10));
    } else {
      epochMap.set(basename, tRaw);
    }
  }
  // console.log(timeMap); console.log(epochMap);
}

/**
 * TODO
 */
const setEpochOffset = async () => {
  /* work out minimum epoch time to set the offset appropriately */
  let epochOffset = 1E100;
  if (epochMap.size) {
    epochMap.forEach((tRaw, key) => {
      if (tRaw < epochOffset) epochOffset = tRaw;
    });
  }

  /* what's the minimum offset time from the summary stats, if they exist? */
  if (timeMap.size) {
    let minT = 1E100;
    let minKey;
    timeMap.forEach((t, key) => {
      if (t < minT) minKey = key;
    });
    const epochTime = await getTimeViaSequencingSummary(path.join(global.config.basecalledPath, minKey));
    if (epochTime < epochOffset) {
      epochOffset = epochTime;
    }
  }

  /* adjust entries in the epochMap accordingly (and shift to timeMap)*/
  verbose("timing", `epochOffset=${epochOffset}`);
  epochMap.forEach((tRaw, key) => {
    timeMap.set(key, parseInt((tRaw - epochOffset)/1000, 10));
  });
  epochMap.clear();
  epochMap.set("offset", epochOffset);

  // console.log(timeMap, epochMap)
}

module.exports = {
  setReadTime,
  getReadTime,
  setEpochOffset,
  getTimeFromAnnotatedCSV
}

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const Deque = require("collections/deque");
const { getReadTime } = require('./readTimes');
const { prettyPath, log, warn, verbose } = require('./utils');
// const { timerStart, timerEnd } = require('./timers');

// TODO -- cannot import datastoreUpdated due to circular dependency, but I can't find it!
// we get around this by using global.TMP_DATASTORE_UPDATED_FUNC
// const { datastoreUpdated } = require("./socket"); 


/**
 * This file defines the global.mappingQueue handler, which processes demuxed
 * FASTQ files. Note that the data has already been partially extracted
 * from these files, and a corresponding entry is present in global.datastore
 * 
 * global.mappingQueue contains objets of `[pointer, fileToMap]` where
 * the pointer defines the idx of the partial info in global.datastore.
 * global.mappingQueue is a `Deque`
 *
 * The interface between node and the mapper (currently a python script which
 * calls minimap2) is contained here
 */
const mappingQueue = new Deque();

mappingQueue.observeRangeChange(() => {mapper();});
const addToMappingQueue = (thing) => mappingQueue.push(thing);


const save_coordinate_reference_as_fasta = (refSeq) => {
  /* python's mappy needs a FASTA file of the reference sequence,
  you can't give it the string from the coorinate JSON :( */
  verbose("[save_coordinate_reference_as_fasta]");
  const fasta = ">COORDINATE_REFERENCE\n"+refSeq;
  fs.writeFileSync("coordinate_reference.fasta", fasta);
}

/**
 * When mapping is successful we want to insert the data into the datastore
 * @param {int} datastorePointer dict of BC name ("BC01", not user supplied) -> idx
 * such that datastore[bc][idx] is the relevent data point for this read
 * @param {obj} results from mapper. Array of Arrays. Each array of length 5
 * [0] {str} barcode, [1] {str} best reference, [2] {int} mapping start pos
 * [3] {int} mapping end pos (note: may be "less than" [2])
 * [4] {float} mapping match frac
 */
const addToDatastore = (datastorePointers, results) => {
  // timerStart("mapping->datastore");

  for (const [bc, idx] of Object.entries(datastorePointers)) {
    global.datastore[bc][idx].mappedCount = 0;
    global.datastore[bc][idx].readPositions = [];
    global.datastore[bc][idx].readLengths = [];
    global.datastore[bc][idx].refMatches = {};
  }

  results.forEach((d) => {
    const bc = d[0] === "none" ? "noBarcode" : d[0];
    const idx = datastorePointers[bc];
    if (idx === undefined) {
      throw new Error(`Mapping barcode of ${bc} not one of the demuxed barcodes`)
    }
    global.datastore[bc][idx].mappedCount++;
    global.datastore[bc][idx].readPositions.push([d[2], d[3]]);
    global.datastore[bc][idx].readLengths.push(Math.abs(d[3]-d[2]));
    if (global.datastore[bc][idx].refMatches[d[1]]) {
      global.datastore[bc][idx].refMatches[d[1]].push(d[4]);
    } else {
      global.datastore[bc][idx].refMatches[d[1]] = [d[4]];
    }
  })
  // timerEnd("mapping->datastore")
  global.TMP_DATASTORE_UPDATED_FUNC();
};


const call_python_mapper = (fastq) => new Promise((resolve, reject) => {
    const pyprog = spawn('python3', [
        "./server/map_single_fastq.py",
        "-c", "coordinate_reference.fasta",
        "-p", global.config.referencePanelPath,
        "-f", fastq
    ]);
    let stdout = "";
    let stderr = "";
    pyprog.stdout.on('data', (data) => {stdout+=data});
    pyprog.stderr.on('data', (data) => {stderr+=data});

    // stochastically mock failure
    if (global.MOCK_FAILURES && Math.random() < 0.05) {
        reject("Mock mapping failure")
    }

    pyprog.on('close', (code) => {
        // console.log(`Python script finished. Exit code ${code}`);
        if (code === 0) {
            resolve(JSON.parse(stdout));
        } else {
            reject(stderr)
        }
    });
});

let isRunning = false; // only want one mapping thread at a time!
const mapper = async () => {

  /* the mapper can _only_ run _if_ we have defined both a reference panel and a
  "main" reference config. (Perhaps this could be relaxed in the future) */
  if (!(global.config.reference && global.config.referencePanel)) {
    verbose("Cannot start mapper without main reference & reference panel");
    return;
  }
  if (isRunning) {
    verbose("[mapper] called but already running");
    return;
  }

  if (mappingQueue.length) {
    isRunning = true;
    let results;
    const [datastorePointers, fileToMap] = mappingQueue.shift();
    try {
      verbose(`[mapper] queue length: ${mappingQueue.length+1}. Mapping ${prettyPath(fileToMap)}`);
      results = await call_python_mapper(fileToMap);
      addToDatastore(datastorePointers, results);
      verbose(`[mapper] Mapped ${prettyPath(fileToMap)}. Read time: ${getReadTime(fileToMap)}.`);

    } catch (err) {
      warn(`Mapping ${fileToMap.split("/").slice(-1)[0]}: ${err}`);
    }
    isRunning = false;
    mapper(); // recurse
  }
}

module.exports = {
  mapper,
  addToMappingQueue,
  save_coordinate_reference_as_fasta
}

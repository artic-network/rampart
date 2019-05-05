const { spawn } = require('child_process');
const path = require('path');
const Deque = require("collections/deque");
const { setReadTime, getReadTime } = require("./readTimes");
// const { datastoreUpdated } = require("./socket");
const { verbose, warn } = require("./utils");
const { addToMappingQueue } = require("./mapper");

/**
 * This file defines the deque handler, which processes FASTQ files
 * on the demuxQueue and adds them to the mappingQueue.
 *
 * The interface between node and the demuxer (currently porechop)
 * is contained here
 */
const demuxQueue = new Deque();
demuxQueue.observeRangeChange(() => {demuxer();});


const addToDemuxQueue = (thing) => demuxQueue.push(thing);


let isRunning = false; // only want one porechop thread at a time!

const call_porechop = (fastqIn, fastqOut, relaxedDemuxing) => new Promise((resolve, reject) => {
    let spawnArgs = [
        '--verbosity', '0',
            '-i', fastqIn,
            '-o', fastqOut,
            '--discard_middle',
            '--barcode_threshold', '80',
            '--threads', '2', // '--check_reads', '10000',
            '--barcode_diff', '5',
            '--barcode_labels',
            '--native_barcodes'
        ];
    if (!relaxedDemuxing) {
        spawnArgs.push('--require_two_barcodes');
    }

    const porechop = spawn('porechop', spawnArgs);

    // stochastically mock failure
    if (global.MOCK_FAILURES && Math.random() < 0.05) {
        reject("Mock porechop failure")
    }

    porechop.on('close', (code) => {
        // console.log(`Porechop finished. Exit code ${code}`);
        if (code === 0) {
            resolve();
        } else {
            reject();
        }
    });
});

/**
 * When demuxing is successful we have "some" data -- the barcode counts
 * so we can add this to the datastore. We return (resolve) the pointers to the dataStore
 * locations so that the mapping result can add in further information to the
 * appropriate place
 * @param {string} demuxedFastqPath 
 * @returns {Promise}
 */
const addToDatastore = (demuxedFastqPath) => new Promise((resolve, reject) => {
  // console.log(demuxedFastqPath)
  const getBarcodes = spawn('bash', ["./server/getBarcodesFromDemuxedFastq.sh", demuxedFastqPath]);
  const timestamp = getReadTime(demuxedFastqPath);
  getBarcodes.stdout.on('data', (stdout) => {
    const data = String(stdout).split(/\s+/);
    const pointers = {}; /* the datastore index for each barcode */
    for (let i = 1; i < data.length; i+=2) {
      let bc = data[i];
      if (bc === "none") bc = "noBarcode";
      if (!global.datastore[bc]) {
        global.datastore[bc] = [];
      }
      global.datastore[bc].push({
        demuxedCount: parseInt(data[i-1], 10),
        timestamp
      });
      pointers[bc] = global.datastore[bc].length-1;
    }
    resolve(pointers);
  });
  getBarcodes.on('close', (code) => {
    reject(code);
  });
});


const demuxer = async () => {
    // console.log("demuxer watching deque with ", demuxQueue.length, "files")
    // waiting for >= 2 files here, as guppy continuously writes to files
    if (demuxQueue.length > 1 && !isRunning) {
        isRunning = true;
        const fileToDemux = demuxQueue.shift();
        const fileToDemuxBasename = path.basename(fileToDemux);
        const fastqToWrite = path.join(global.config.demuxedPath, fileToDemuxBasename);
        try {
            verbose(`[demuxer] queue length: ${demuxQueue.length+1}. Beginning demuxing of: ${fileToDemuxBasename}`);
            await Promise.all([ /* fail fast */
                call_porechop(fileToDemux, fastqToWrite, global.config.relaxedDemuxing),
                setReadTime(fileToDemux)
            ]);
            const datastoreIdx = await addToDatastore(fastqToWrite);
            verbose(`[demuxer] ${fileToDemuxBasename} demuxed. Read time: ${getReadTime(fileToDemuxBasename)}`);
            // datastoreUpdated(); // see note in mapper.js
            global.TMP_DATASTORE_UPDATED_FUNC();
            addToMappingQueue([datastoreIdx, fastqToWrite]);
        } catch (err) {
          warn(`Demuxing / extracting time of ${fileToDemuxBasename}: ${err}`);
        }
        isRunning = false;
        demuxer(); // recurse
    }
}

module.exports = { demuxer, addToDemuxQueue };

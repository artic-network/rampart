const { spawn } = require('child_process');
const path = require('path');
const Deque = require("collections/deque");
const { setReadTime, getReadTime } = require("./readTimes");
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
 * @param {string} demuxedFastqPath 
 * @returns {Promise} resolves with an object of barcode {str} -> demuxed counts {int}
 */
const getBarcodeDemuxCounts = (demuxedFastqPath) => new Promise((resolve, reject) => {
  // console.log(demuxedFastqPath)
  const getBarcodes = spawn('./server/getBarcodesFromDemuxedFastq.py', [demuxedFastqPath]);
  getBarcodes.stdout.on('data', (stdout) => {
    const data = String(stdout).split(/\s+/);
    const barcodeDemuxCounts = {};
    for (let i = 1; i < data.length; i+=2) {
      barcodeDemuxCounts[data[i]] = parseInt(data[i-1], 10);
    }
    resolve(barcodeDemuxCounts);
  });
  getBarcodes.on('close', (code) => {
    reject(code);
  });
});


let isRunning = false; // only want one porechop thread at a time!
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
            const timestamp = getReadTime(fileToDemuxBasename);
            const barcodeDemuxCounts = await getBarcodeDemuxCounts(fastqToWrite);
            const datastoreAddress = global.datastore.addDemuxedFastq(fileToDemuxBasename, barcodeDemuxCounts, timestamp);
            verbose(`[demuxer] ${fileToDemuxBasename} demuxed. Read time: ${timestamp}`);
            addToMappingQueue([datastoreAddress, fastqToWrite]);
        } catch (err) {
          console.trace(err);
          warn(`Demuxing / extracting time of ${fileToDemuxBasename}: ${err}`);
        }
        isRunning = false;
        demuxer(); // recurse
    }
}

module.exports = { demuxer, addToDemuxQueue };

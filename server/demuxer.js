const { spawn } = require('child_process');
const path = require('path')
// const { sleep } = require("./utils");

let isRunning = false; // only want one porechop thread at a time!

const call_porechop = (fastqIn, fastqOut) => new Promise((resolve, reject) => {
  const porechop = spawn('porechop', [
    '--verbosity', '1',
    '-i', fastqIn,
    '-o', fastqOut,
    '--discard_middle', '--require_two_barcodes', '--barcode_threshold', '80',
    '--threads', '2', '--check_reads', '10000',
    '--barcode_diff', '5', '--barcode_labels'
  ]);
  // stochastically mock failure
  if (global.dev && Math.random() < 0.05) {
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

const demuxer = async () => {
  // console.log("demuxer watching deque with ", global.guppyFastqs.length, "files")
  // cautiously waiting for >= 2 files here, as i'm not sure if guppy continuously writes to a file or not
  if (global.guppyFastqs.length > 1 && !isRunning) {
    isRunning = true;
    const basecalledFastq = global.guppyFastqs.shift();
    const fastqToWrite = path.join(global.config.demuxedPath, path.basename(basecalledFastq));
    try {
      // await sleep(1000); // slow things down for development
      console.log("Demuxing ", path.basename(basecalledFastq))
      await call_porechop(basecalledFastq, fastqToWrite);
      console.log("\t", path.basename(basecalledFastq), "demuxed")
      global.porechopFastqs.push(fastqToWrite)
    } catch (err) {
      console.log(`*** ERROR *** Demuxing ${path.basename(basecalledFastq)}: ${err}`);
    }
    isRunning = false;
    demuxer(); // recurse
  }
}

module.exports = { demuxer };

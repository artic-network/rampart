const fs = require('fs')
const path = require('path')
const { promisify } = require('util');
const { save_coordinate_reference_as_fasta } = require("./mapper");
const readdir = promisify(fs.readdir);
const { spawn } = require('child_process');


const getFastqTimestamp = (filepath) => new Promise((resolve, reject) => {
  const head = spawn('head', ['-n', '1', filepath]);
  head.stdout.on('data', (data) => {
    resolve((new Date((/start_time=(\S+)/g).exec(data)[1])).getTime());
  });
});

const startUp = async () => {
  console.log("\nRAMPART start up - Scanning input folders...");
  /* the python mapping script needs a FASTA of the main reference (we have this inside the config JSON) */
  save_coordinate_reference_as_fasta(global.config.reference.sequence);

  /* Scan the FAST5 folder and put them onto a deque */


  /* Scan the basecalled folder and put them onto a deque */
  let basecalledFastqs = (await readdir(global.config.basecalledPath))
    .filter((j) => j.endsWith(".fastq"))
    .sort((a, b) => parseInt(a.match(/\d+/), 10) > parseInt(b.match(/\d+/), 10) ? 1 : -1)
    .map((j) => path.join(global.config.basecalledPath, j));

  /* examining the time stamps can be slow */
  if (global.dev) {
    console.log("\tdev mode: TRUE. Only considering 100 FASTQs for speed reasons")
    basecalledFastqs = basecalledFastqs.slice(0, 100);
  }
  console.log(`\tFound ${basecalledFastqs.length} mapped FASTQ files. Sorting by timestamp...`)

  /* sort the basecalled FASTQs based upon timestamps
  (necessary as the guppy filenames are not chronological) */
  // console.log(basecalledFastqs.length)
  const timeMap = new Map();
  for (let i=0; i<basecalledFastqs.length; i++) {
    try {
      const timestamp = await getFastqTimestamp(basecalledFastqs[i]);
      timeMap.set(basecalledFastqs[i], timestamp);
    } catch (err) {
      // no-op. There won't be a timestamp in timeMap and the fastq will be ignored
    }
  }
  basecalledFastqs = basecalledFastqs.filter((f) => timeMap.has(f))
    .sort((a, b) => timeMap.get(a)>timeMap.get(b) ? 1 : -1);
  // push them onto the deque
  basecalledFastqs.forEach((fastqPath) => {global.guppyFastqs.push(fastqPath)});
  console.log(`\tSorted!`)

  /* clear the folder contents of the demuxed directory
  NOTE: this clearly shouldn't be done, but we need to ensure that files
  arrive at the client in chronological order. Perhaps store the demuxed
  file listing in a cache, and when shifting off the mapped deque, check
  the cache before running porechop? */
  console.log(`\tClearing the demuxed folder contents (will be improved)`)
  const demuxedFilesToDelete = await readdir(global.config.demuxedPath);
  for (const file of demuxedFilesToDelete) {
    fs.unlinkSync(path.join(global.config.demuxedPath, file));
  }

  console.log("RAMPART start up FINISHED\n");
}


module.exports = {startUp}

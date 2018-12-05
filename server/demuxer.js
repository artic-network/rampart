const { spawn } = require('child_process');
const path = require('path');
const chalk = require('chalk');
// const { sleep } = require("./utils");

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
    // if (global.dev && Math.random() < 0.05) {
    //   reject("Mock porechop failure")
    // }

    // print stdout from process (for debugging)
    // process.stdin.pipe(porechop.stdin)
    // porechop.stdout.on('data', (data) => {
    //     console.log(`${data}`);
    // });

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
    // console.log("demuxer watching deque with ", global.demuxQueue.length, "files")
    // waiting for >= 2 files here, as guppy continuously writes to files
    if (global.demuxQueue.length > 1 && !isRunning) {
        isRunning = true;
        const fileToDemux = global.demuxQueue.shift();
        const fastqToWrite = path.join(global.config.demuxedPath, path.basename(fileToDemux));
        try {
            console.log(chalk.green(`DEMUXER: queue length: ${global.demuxQueue.length+1}. Beginning demuxing of: ${path.basename(fileToDemux)}`));
            await call_porechop(fileToDemux, fastqToWrite, global.args.relaxedDemuxing || global.config.relaxedDemuxing);
            console.log(chalk.green(`DEMUXER: ${path.basename(fileToDemux)} demuxed.`));
            global.mappingQueue.push(fastqToWrite);
        } catch (err) {
            console.log(chalk.redBright(`*** ERROR *** Demuxing ${path.basename(fileToDemux)}: ${err}`));
        }
        isRunning = false;
        demuxer(); // recurse
    }
}

module.exports = { demuxer };

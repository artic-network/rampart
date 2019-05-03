const { spawn } = require('child_process');
const path = require('path');
const chalk = require('chalk');
const { setReadTime } = require("./extractReadTime");

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
    if (global.args.mockFailures && Math.random() < 0.05) {
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
    // console.log("demuxer watching deque with ", global.demuxQueue.length, "files")
    // waiting for >= 2 files here, as guppy continuously writes to files
    if (global.demuxQueue.length > 1 && !isRunning) {
        isRunning = true;
        const fileToDemux = global.demuxQueue.shift();
        const fileToDemuxBasename = path.basename(fileToDemux);
        const fastqToWrite = path.join(global.config.demuxedPath, fileToDemuxBasename);
        try {
            console.log(chalk.green(`DEMUXER: queue length: ${global.demuxQueue.length+1}. Beginning demuxing of: ${fileToDemuxBasename}`));
            await Promise.all([ /* fail fast */
                call_porechop(fileToDemux, fastqToWrite, global.args.relaxedDemuxing || global.config.relaxedDemuxing),
                setReadTime(fileToDemux)]
            );
            console.log(chalk.green(`DEMUXER: ${fileToDemuxBasename} demuxed. Read time: ${global.timeMap.get(fileToDemuxBasename)}`));
            global.mappingQueue.push(fastqToWrite);
        } catch (err) {
            console.log(chalk.redBright(`*** ERROR *** Demuxing / extracting time of ${fileToDemuxBasename}: ${err}`));
        }
        isRunning = false;
        demuxer(); // recurse
    }
}

module.exports = { demuxer };

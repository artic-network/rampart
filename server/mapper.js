const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { setTimeViaFastq } = require('./extractReadTime');

let isRunning = false; // only want one mapping thread at a time!

const save_coordinate_reference_as_fasta = (refSeq) => {
    /* python's mappy needs a FASTA file of the reference sequence,
    you can't give it the string from the coorinate JSON :( */
    const fasta = ">COORDINATE_REFERENCE\n"+refSeq;
    fs.writeFileSync("coordinate_reference.fasta", fasta);
}

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
    if (global.args.mockFailures && Math.random() < 0.05) {
        reject("Mock mapping failure")
    }

    pyprog.on('close', (code) => {
        // console.log(`Python script finished. Exit code ${code}`);
        if (code === 0) {
            let mappingResult = JSON.parse(stdout);
            mappingResult.time = global.timeMap.get(path.basename(fastq));
            delete mappingResult.timeStamp;
            resolve(mappingResult)
        } else {
            reject(stderr)
        }
    });
});

const mapper = async () => {
    if (global.mappingQueue.length && !isRunning) {
        isRunning = true;
        let results;
        const fileToMap = global.mappingQueue.shift();
        try {
            results = await call_python_mapper(fileToMap);

            if (!global.timeMap.has(path.basename(fileToMap))) {
                await setTimeViaFastq(fileToMap);
            }

            global.mappingResults.push(results)
            console.log(chalk.green(`MAPPER:  Mapped ${fileToMap.split("/").slice(-1)[0]}. Read time: ${results.time}`));


        } catch (err) {
            console.log(chalk.redBright(`*** ERROR *** Mapping ${fileToMap.split("/").slice(-1)[0]}: ${err}`));
        }
        isRunning = false;
        mapper(); // recurse
    }
}

module.exports = {mapper, save_coordinate_reference_as_fasta}

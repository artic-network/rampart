const { spawn } = require('child_process');
const fs = require('fs');
const { sleep } = require("./utils");

let isRunning = false; // only want one mapping thread at a time!

// const save_coordinate_reference_as_fasta = (refSeq) => {
//     /* python's mappy needs a FASTA file of the reference sequence,
//     you can't give it the string from the coorinate JSON :( */
//     const fasta = ">COORDINATE_REFERENCE\n"+refSeq;
//     fs.writeFileSync("coordinate_reference.fasta", fasta);
// }

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
            if (global.args.ignoreTimeStamps) {
                mappingResult.time = Date.now();
            } else {
                mappingResult.time = (new Date(mappingResult.timeStamp)).getTime()
            }
            resolve(mappingResult)
        } else {
            reject(stderr)
        }
    });
});

const mapper = async () => {
    // console.log("porechopFastqs listener", porechopFastqs.length)
    // console.log("isRunning", isRunning)
    if (global.porechopFastqs.length && !isRunning) {
        isRunning = true;
        let results;
        const fastq = global.porechopFastqs.shift();
        try {
            // await sleep(1000); // slow things down for development
            results = await call_python_mapper(fastq);
            global.mappingResults.push(results)
            console.log(`Mapped ${fastq.split("/").slice(-1)[0]}. Num seqs: ${results.readData.length}. Timestamp: ${results.timeStamp}`);
        } catch (err) {
            console.log(`*** ERROR *** Mapping ${fastq.split("/").slice(-1)[0]}: ${err}`);
        }
        isRunning = false;
        mapper(); // recurse
    }
}

module.exports = {mapper}
//module.exports = {mapper, save_coordinate_reference_as_fasta}

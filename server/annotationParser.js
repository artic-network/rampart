const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const Deque = require("collections/deque");
const { getReadTime } = require('./readTimes');
const { prettyPath, warn, verbose } = require('./utils');

/**
 * This file defines the global.parserQueue handler, which processes annotated
 * FASTQ files. Note that the data has already been partially extracted
 * from these files, and a corresponding entry is present in global.datastore
 *
 * global.parsingQueue contains objects of `[pointer, fileToMap]` where
 * the pointer defines the idx of the partial info in global.datastore.
 * global.parsingQueue is a `Deque`
 *
 * The interface between node and the annotationParser (currently a python script which
 * calls minimap2) is contained here
 */
const parsingQueue = new Deque();

parsingQueue.observeRangeChange(() => {annotationParser();});
const addToParsingQueue = (thing) => parsingQueue.push(thing);


// const save_coordinate_reference_as_fasta = (refSeq, dir) => {
//     /* python's mappy needs a FASTA file of the reference sequence,
//     you can't give it the string from the coorinate JSON :( */
//     verbose("[save_coordinate_reference_as_fasta]");
//     const fasta = ">COORDINATE_REFERENCE\n"+refSeq;
//     const filePath = path.join(dir, "coordinate_reference.fasta");
//     fs.writeFileSync(filePath, fasta);
//     return filePath;
// }

const call_python_parser = (fastq) => new Promise((resolve, reject) => {
    const pyprog = spawn('python3', [
        "./server/parse_single_fastq.py",
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
            if (stderr) console.log(stderr);
            resolve(JSON.parse(stdout));
        } else {
            reject(stderr)
        }
    });
});

let isRunning = false; // only want one mapping thread at a time!
const annotationParser = async () => {

    // Removing this because this is now done in the annotation queue
    // /* the annotationParser can _only_ run _if_ we have defined both a reference panel and a
    // "main" reference config. (Perhaps this could be relaxed in the future) */
    // if (!(global.config.reference && global.config.referencePanel.length)) {
    //     verbose(`Cannot start mapper without main reference (provided: ${!!global.config.reference}) AND reference panel (provided: ${!!global.config.referencePanel.length})`);
    //     return;
    // }

    if (isRunning) {
        verbose("[annotationParser] called but already running");
        return;
    }

    if (parsingQueue.length) {
        isRunning = true;
        let results;
        const [datastoreAddress, fileToParse] = parsingQueue.shift();
        try {
            verbose(`[parser] queue length: ${parsingQueue.length+1}. Mapping ${prettyPath(fileToParse)}`);
            results = await call_python_parser(fileToParse);
            global.datastore.addMappedFastq(datastoreAddress, results);
            verbose(`[parser] Mapped ${prettyPath(fileToParse)}. Read time: ${getReadTime(fileToParse)}.`);
        } catch (err) {
            console.trace(err);
            warn(`Parsing ${fileToParse.split("/").slice(-1)[0]}: ${err}`);
        }
        isRunning = false;
        annotationParser(); // recurse
    }
}

module.exports = {
    annotationParser,
    addToParsingQueue
}

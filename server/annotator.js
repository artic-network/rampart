const { spawn } = require('child_process');
const path = require('path');
const Deque = require("collections/deque");
const { setReadTime, getReadTime } = require("./readTimes");
const { verbose, warn } = require("./utils");
const { addToParserQueue } = require("./annotationParser");

/**
 * This file defines the deque handler, which processes FASTQ files
 * on the annotationQueue and adds them to the parsingQueue.
 *
 * The provided read processing script his called here which takes
 * newly basecalled fastq files and provides all necessary annotations
 * for RAMPART (i.e., barcode calls, reference matches and coodinates).
 */
const annotationQueue = new Deque();
annotationQueue.observeRangeChange(() => {demuxer();});
const addToAnnotationQueue = (thing) => annotationQueue.push(thing);

/**
 * Todo - this needs to be fixed to call the Snakemake pipeline
 * @param fastqIn
 * @param fastqOut
 * @param relaxedDemuxing
 * @returns {Promise<any>}
 */
const call_annotation_script = (fastqIn, fastqOut, relaxedDemuxing) => new Promise((resolve, reject) => {
    let spawnArgs = [
        '--verbosity', '0',
            '-i', fastqIn,
            '-o', fastqOut,
            '--barcode_threshold', '80',
            '--threads', '2', // '--check_reads', '10000',
            '--barcode_diff', '5',
            '--barcode_labels'
        ];

    console.log('Annotation script: ' + spawnArgs.join(" "));

    const annotationScript = spawn('snakemake', spawnArgs);

    annotationScript.on('close', (code) => {
        // console.log(`Annotation script finished. Exit code ${code}`);
        if (code === 0) {
            resolve();
        } else {
            reject();
        }
    });
});

// /**
//  * When demuxing is successful we have "some" data -- the barcode counts
//  * @param {string} demuxedFastqPath
//  * @returns {Promise} resolves with an object of barcode {str} -> demuxed counts {int}
//  */
// const getBarcodeDemuxCounts = (demuxedFastqPath) => new Promise((resolve, reject) => {
//   // console.log(demuxedFastqPath)
//   const getBarcodes = spawn('./server/getBarcodesFromDemuxedFastq.py', [demuxedFastqPath]);
//   getBarcodes.stdout.on('data', (stdout) => {
//     const data = String(stdout).split(/\s+/);
//     const barcodeDemuxCounts = {};
//     for (let i = 1; i < data.length; i+=2) {
//       barcodeDemuxCounts[data[i]] = parseInt(data[i-1], 10);
//     }
//     resolve(barcodeDemuxCounts);
//   });
//   getBarcodes.on('close', (code) => {
//     reject(code);
//   });
// });


let isRunning = false; // only want one annotation thread at a time!
const annotator = async () => {
    // console.log("annotator watching deque with ", annotationQueue.length, "files")
    // waiting for >= 2 files here, as guppy continuously writes to files
    if (annotationQueue.length > 1 && !isRunning) {
        isRunning = true;
        const fileToAnnotate = annotationQueue.shift();
        const fileToAnnotateBasename = path.basename(fileToAnnotate);
        const fileToWrite = path.join(global.config.processedPath, fileToAnnotateBasename);
        try {
            verbose(`[annotator] queue length: ${annotationQueue.length+1}. Beginning annotation of: ${fileToAnnotateBasename}`);
            await Promise.all([ /* fail fast */
                call_annotation_script(fileToAnnotate, fileToWrite),
                setReadTime(fileToAnnotate)
            ]);
            const timestamp = getReadTime(fileToAnnotateBasename);

            // AR - adding a data point in the data store now happens when the annotations are parsed.
            // const barcodeDemuxCounts = await getBarcodeDemuxCounts(fastqToWrite);
            // const datastoreAddress = global.datastore.addDemuxedFastq(fileToAnnotateBasename, timestamp);

            verbose(`[annotator] ${fileToAnnotateBasename} annotated. Read time: ${timestamp}`);

            addToParserQueue([datastoreAddress, fileToWrite]);
        } catch (err) {
          console.trace(err);
          warn(`Processing / extracting time of ${fileToAnnotateBasename}: ${err}`);
        }
        isRunning = false;
        annotator(); // recurse
    }
}

module.exports = { annotator, addToAnnotationQueue };

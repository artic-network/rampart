const { spawn } = require('child_process');
const path = require('path');
const Deque = require("collections/deque");
const { setReadTime, getReadTime } = require("./readTimes");
const { verbose, log, warn } = require("./utils");
const { addToParsingQueue } = require("./annotationParser");

/**
 * This file defines the deque handler, which processes FASTQ files
 * on the annotationQueue and adds them to the parsingQueue.
 *
 * The provided read processing script his called here which takes
 * newly basecalled fastq files and provides all necessary annotations
 * for RAMPART (i.e., barcode calls, reference matches and coodinates).
 */

const annotationQueue = new Deque();

annotationQueue.observeRangeChange( () => { annotator(); } );
const addToAnnotationQueue = (fastqFile) => {
    annotationQueue.push(fastqFile);
};

/**
 * Todo - this needs to be fixed to call the Snakemake pipeline
 * @returns {Promise<any>}
 * @param fastqFileStem
 */
const call_annotation_script = (fastqFileStem) => new Promise((resolve, reject) => {
    const pipelineConfig = [];

    // Snakemake will be called like this:
    //
    // pipeline_path, basecalled_path,
    // snakemake --snakefile [pipeline_path]/Snakefile --configfile [pipeline_path]/config.yaml --cores 2 --config input_path=[basecalled_path] output_path=[annotation_path] protocol_path=[protocol_path]
    //
    // [pipeline_path] is the location of the Snakefile and the default config file
    // [basecalled_path] is the location of the basecalled reads
    // [annotation_path] is the location to write the annotation CSV files
    //
    // any other config key=value pairs can come from the --annotationConfig argument and these will override any of the above.

    pipelineConfig.push(`input_path=${global.config.run.basecalledPath}`);
    pipelineConfig.push(`output_path=${global.config.run.annotatedPath}`);
    pipelineConfig.push(`filename_stem=${fastqFileStem}`);

    if (config.pipelines.annotation.requires) {
        // find any file that the pipeline requires
        config.pipelines.annotation.requires.forEach( (requirement) => {e
            config.pipelines.annotation.configOptions.push(`${requirement.config_key}=${requirement.path}`);
        } );
    }

    if (global.config.pipelines.annotation.configOptions) {
        // optional additional configuration options from configuration files or arguments
        pipelineConfig.push(...global.config.pipelines.annotation.configOptions)
    }

    let spawnArgs = [
        '--snakefile', global.config.pipelines.annotation.path + "Snakefile",
        '--configfile', global.config.pipelines.annotation.path + global.config.pipelines.annotation.config_file,
        '--cores', '2',
        '--config', ...pipelineConfig
    ];

    log(`Annotating ${fastqFileStem}`)

    const annotationScript = spawn('snakemake', spawnArgs);

    const out = [];
    annotationScript.stdout.on(
        'data',
        (data) => {
            out.push(data.toString());
            verbose("annotator", data.toString());
        }
    );

    const err = [];
    // Snakemakes put info on stderr so only show it if it returns an error code
    annotationScript.stderr.on(
        'data',
        (data) => {
            err.push(data.toString());
            // warn(data.toString());
        }
    );

    annotationScript.on('close', (code) => {
        // console.log(`Annotation script finished. Exit code ${code}`);
        if (code === 0) {
            resolve();
        } else {
            err.forEach( (line) => warn(line) );
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

    // waiting for >= 2 files here, as guppy continuously writes to files and we don't know if it
    // has finished until a new one appears.
    if (annotationQueue.length > 1 && !isRunning) {
        isRunning = true;

        const fileToAnnotate = annotationQueue.shift();
        const fileToAnnotateBasename = path.basename(fileToAnnotate, '.fastq');

        try {
            verbose("annotator", `queue length: ${annotationQueue.length+1}. Beginning annotation of: ${fileToAnnotateBasename}`);
            await Promise.all([ /* fail fast */
                call_annotation_script(fileToAnnotateBasename),
                setReadTime(fileToAnnotate)
            ]);

            const timestamp = getReadTime(fileToAnnotateBasename);

            const fileToParse = path.join(global.config.run.annotatedPath, fileToAnnotateBasename + '.csv');

            // AR - adding a data point in the data store now happens when the annotations are parsed.
            // const barcodeDemuxCounts = await getBarcodeDemuxCounts(fastqToWrite);
            // const datastoreAddress = global.datastore.addDemuxedFastq(fileToAnnotateBasename, timestamp);

            verbose("annotator", `${fileToAnnotateBasename} annotated. Read time: ${timestamp}`);

            addToParsingQueue(fileToParse);
        } catch (err) {
            console.trace(err);
            warn(`Processing / extracting time of ${fileToAnnotateBasename}: ${err}`);
        }
        isRunning = false;
        annotator(); // recurse
    }
}

module.exports = { addToAnnotationQueue };

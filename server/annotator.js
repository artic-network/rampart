const { spawn } = require('child_process');
const path = require('path');
const Deque = require("collections/deque");
const { verbose, trace, warn } = require("./utils");
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

    pipelineConfig.push(`input_path="${global.config.run.basecalledPath}"`);
    pipelineConfig.push(`output_path="${global.config.run.annotatedPath}"`);
    pipelineConfig.push(`filename_stem=${fastqFileStem}`);

    if (config.pipelines.annotation.requires) {
        // find any file that the pipeline requires
        config.pipelines.annotation.requires.forEach( (requirement) => {
            pipelineConfig.push(`${requirement.config_key}=${requirement.path}`);
        } );
    }

    if (global.config.pipelines.annotation.configOptions) {
        // optional additional configuration options from configuration files or arguments
        Object.keys(global.config.pipelines.annotation.configOptions).forEach( key => {
            pipelineConfig.push(`${key}=${global.config.pipelines.annotation.configOptions[key]}`);
        });
    }

    let spawnArgs = [
        '--snakefile', global.config.pipelines.annotation.path + "Snakefile",
        '--configfile', global.config.pipelines.annotation.path + global.config.pipelines.annotation.config_file,
        // '--cores', '2',
        '--config', ...pipelineConfig
    ];

    verbose(`Annotating ${fastqFileStem}`);

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
            await call_annotation_script(fileToAnnotateBasename);
            verbose("annotator", `${fileToAnnotateBasename} annotated.`);
            addToParsingQueue(path.join(global.config.run.annotatedPath, fileToAnnotateBasename + '.csv'));
        } catch (err) {
            trace(err);
            warn(`Processing / extracting time of ${fileToAnnotateBasename}: ${err}`);
        }
        isRunning = false;
        annotator(); // recurse
    }
}

module.exports = { addToAnnotationQueue };

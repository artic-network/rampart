const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { addToParsingQueue } = require("./annotationParser");
const { addToAnnotationQueue } = require("./annotator");
const readdir = promisify(fs.readdir);
const { prettyPath, log } = require('./utils');

const getFilesFromDirectory = async (dir, extension) => {
    let fastqs = (await readdir(dir));
    return fastqs
        .filter((j) => {
            const ext = extension;
            return j.endsWith(`.${ext}`);
        })
        .sort((a, b) => parseInt(a.match(/\d+/), 10) > parseInt(b.match(/\d+/), 10) ? 1 : -1)
        .map((j) => path.join(dir, j));
};

/**
 * Initialisation function for RAMPART. Must only be called once.
 * Performs a number of steps including:
 * 1. Path checking (defined via config file).
 * 2. Collection of FASTQ / CSV files present at start up.
 * 3. Adding of those files (as appropriate, no duplicates) to annotation & parsing queues.
 */
const startUp = async () => {
    log("RAMPART starting up");

    if (!global.config.run.basecalledPath) {
        // todo - get basecalledPath from user interface
        throw new Error("[startUp] basecalled path not specified");
    }
    if (!global.config.pipelines.annotation.requires[0].path) {
        // todo - get references path from user interface
        throw new Error("[startUp] references.fasta path not specified");
    }

    if (!fs.existsSync(global.config.run.basecalledPath) || !fs.existsSync(global.config.run.annotatedPath)) {
        throw new Error("[startUp] no basecalled dir / annotated dir");
    }

    /* Collect basecalled FASTQs */
    const pathsOfBasecalledFastqs = await getFilesFromDirectory(global.config.run.basecalledPath, 'fastq');
    log(`  * Found ${pathsOfBasecalledFastqs.length} basecalled fastqs in ${prettyPath(global.config.run.basecalledPath)}`);

    /* Annotated files (CSVs) are added to the `parsingQueue` and `globals.filesSeen` */
    if (global.config.run.clearAnnotated) {
        log(`  * Clearing the annotated folder (${prettyPath(global.config.run.annotatedPath)})`);
        const annotatedFilesToDelete = await readdir(global.config.run.annotatedPath);
        for (const file of annotatedFilesToDelete) {
            fs.unlinkSync(path.join(global.config.run.annotatedPath, file));
        }
    } else {
        const pathsOfAnnotatedCSVs = await getFilesFromDirectory(global.config.run.annotatedPath, 'csv');
        log(`  * Found ${pathsOfAnnotatedCSVs.length} annotated CSV files in ${prettyPath(global.config.run.annotatedPath)}`);
        /* TODO - we could sort these based on time stamps if we wished */
        /* TODO - we could filter these to remove ones without a corresponding FASTQ, but that wouldn't let
        us start from annotated files which may be useful */
        pathsOfAnnotatedCSVs.forEach((f) => {
            addToParsingQueue(f);
            global.filesSeen.add(path.basename(f, '.csv'));
        });
    }

    /* For those FASTQs without a corresponding annotated CSV, add them to the `annotationQueue`
    and to `globals.filesSeen` */
    /* TODO - we could sort these based on time stamps if we wished */
    pathsOfBasecalledFastqs.forEach((f) => {
        const basename = path.basename(f, '.fastq');
        if (global.filesSeen.has(basename)) {
            return; /* annotated CSV present (added above) */
        }
        addToAnnotationQueue(f);
        global.filesSeen.add(basename);
    })

    log`RAMPART start up FINISHED\n`;
    return true;
};

module.exports = {startUp};



/* UNUSED CODE SNIPPETS */
/* sort the fastqs via these timestamps and push onto the appropriate deques */
// log(`  * Sorting available basecalled and annotation files based on read times`);
// annotatedCSVs
//     .sort((a, b) => getReadTime(a)>getReadTime(b) ? 1 : -1)
//     .forEach((f) => {
//         addToParsingQueue(f);
//         global.fastqsSeen.add(path.basename(f));
//     });

// /* EXTRACT TIMESTAMPS FROM THOSE FASTQs */
// const { setReadTime, getReadTime, setEpochOffset } = require('./readTimes');
// log(`  * Getting read times from basecalled and annotation files`);
// for (let fastq of basecalledFastqs) {
//     await setReadTime(fastq);
// }
// for (let fastq of annotatedCSVs) {
//     await setReadTime(fastq);
// }
// setEpochOffset();

// testing an output pipeline:
// const { PipelineRunner } = require("./PipelineRunner");
//const binFastaPipeline = new PipelineRunner(name, snakefilePath, configfilePath, configOptions, queue);

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { addToParsingQueue } = require("./annotationParser");
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
 * validate provided config files. All path checking etc should be here.
 */
const validateConfig = async () => {
    if (!global.config.run.basecalledPath) {
        // todo - get basecalledPath from user interface
        throw new Error("[validateConfig] basecalled path not specified");
    }
    if (!global.config.pipelines.annotation.requires[0].path) {
        // todo - get references path from user interface
        throw new Error("[validateConfig] references.fasta path not specified");
    }

    if (!fs.existsSync(global.config.run.basecalledPath) || !fs.existsSync(global.config.run.annotatedPath)) {
        throw new Error("[validateConfig] no basecalled dir / annotated dir");
    }
}

/**
 * Process existing datafiles (basecalled FASTQs + annotated CSVs)
 * Adds these (as appropriate, no duplicates) to annotation & parsing queues.
 */
const processExistingData = async () => {
    log("Scanning data already present");

    /* Collect basecalled FASTQs */
    const fastqs = await getFilesFromDirectory(global.config.run.basecalledPath, 'fastq');

    const pathsOfBasecalledFastqs = fastqs.sort((a, b) => {
        const regex = /(\d+)\.fastq/;
        const ai = parseInt(a.match(regex)[1], 10)
        const bi = parseInt(b.match(regex)[1], 10)
        return ai - bi;
    });
    log(`  * Found ${pathsOfBasecalledFastqs.length} basecalled fastqs in ${prettyPath(global.config.run.basecalledPath)}`);

    /* Annotated files (CSVs) are added to the `parsingQueue` and `globals.filesSeen` */
    if (global.config.run.clearAnnotated) {
        log(`  * Clearing CSVs from the annotated folder (${prettyPath(global.config.run.annotatedPath)})`);
        const annotatedFilesToDelete = await readdir(global.config.run.annotatedPath);
        for (const file of annotatedFilesToDelete) {
            const fullPath = path.join(global.config.run.annotatedPath, file);
            if (!fs.lstatSync(fullPath).isDirectory() && fullPath.endsWith(".csv")) {
                fs.unlinkSync(fullPath);
            }
        }
    } else {
        const csvs = await getFilesFromDirectory(global.config.run.annotatedPath, 'csv');

        const pathsOfAnnotatedCSVs = csvs.sort((a, b) => {
            const regex = /(\d+)\.csv/;
            const ai = parseInt(a.match(regex)[1], 10)
            const bi = parseInt(b.match(regex)[1], 10)
            return ai - bi;
        });

        log(`  * Found ${pathsOfAnnotatedCSVs.length} annotated CSV files in ${prettyPath(global.config.run.annotatedPath)}`);
        /* TODO - we could sort these based on time stamps if we wished */
        /* TODO - we could filter these to remove ones without a corresponding FASTQ, but that wouldn't let
        us start from annotated files which may be useful */
        pathsOfAnnotatedCSVs.forEach((f) => {
            addToParsingQueue(f);
            global.filesSeen.add(path.basename(f, '.csv'));
        });
    }

    /* For those FASTQs without a corresponding annotated CSV, add them to `global.annotationRunner`
    and to `globals.filesSeen` */
    /* TODO - we could sort these based on time stamps if we wished */
    pathsOfBasecalledFastqs.forEach((f) => {
        const basename = path.basename(f, '.fastq');
        if (global.filesSeen.has(basename)) {
            return; /* annotated CSV present (added above) */
        }
        global.annotationRunner.addToQueue({
            input_path: global.config.run.basecalledPath,
            output_path: global.config.run.annotatedPath,
            filename_stem: basename
        });
        global.filesSeen.add(basename);
    })

    return true;
};

module.exports = {processExistingData, validateConfig};



/* UNUSED CODE SNIPPETS */
/* sort the fastqs via these timestamps and push onto the appropriate deques */
// log(`  * Sorting available basecalled and annotation files based on read times`);
// annotatedCSVs
//     .sort((a, b) => getReadTime(a)>getReadTime(b) ? 1 : -1)
//     .forEach((f) => {
//         addToParsingQueue(f);
//         global.fastqsSeen.add(path.basename(f));
//     });

// testing an output pipeline:
// const { PipelineRunner } = require("./PipelineRunner");
//const binFastaPipeline = new PipelineRunner(name, snakefilePath, configfilePath, configOptions, queue);

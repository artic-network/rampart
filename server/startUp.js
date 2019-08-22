const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { addToParsingQueue } = require("./annotationParser");
const { addToAnnotationQueue } = require("./annotator");
const { PipelineRunner } = require("./PipelineRunner");
const readdir = promisify(fs.readdir);
const { setReadTime, getReadTime, setEpochOffset } = require('./readTimes');
const { prettyPath, log, deleteFolderRecursive } = require('./utils');

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

    /* Create & clear a temporary directory to store data in during the run */
    // do we need a tmp dir any more?
    // if (fs.existsSync(global.config.rampartTmpDir)) {
    //   deleteFolderRecursive(global.config.rampartTmpDir);
    // }
    // fs.mkdirSync(global.config.rampartTmpDir);

    let unsortedBasecalledFastqs = [];
    if (global.config.run.basecalledPath) {
        unsortedBasecalledFastqs = await getFilesFromDirectory(global.config.run.basecalledPath, 'fastq');
        log(`  * Found ${unsortedBasecalledFastqs.length} basecalled fastqs in ${prettyPath(global.config.run.basecalledPath)}`);
    }

    let unsortedAnnotationCSVs = [];
    if (global.config.run.clearAnnotated) {
        log(`  * Clearing the annotated folder (${prettyPath(global.config.run.annotatedPath)})`);
        const annotatedFilesToDelete = await readdir(global.config.run.annotatedPath);
        for (const file of annotatedFilesToDelete) {
            fs.unlinkSync(path.join(global.config.run.annotatedPath, file));
        }
    } else {
        unsortedAnnotationCSVs = await getFilesFromDirectory(global.config.run.annotatedPath, 'csv');
        log(`  * Found ${unsortedAnnotationCSVs.length} annotation CSV files in ${prettyPath(global.config.run.annotatedPath)}`);
    }

    /* EXTRACT TIMESTAMPS FROM THOSE FASTQs */
    log(`  * Getting read times from basecalled and annotation files`);
    for (let fastq of unsortedBasecalledFastqs) {
        await setReadTime(fastq);
    }
    for (let fastq of unsortedAnnotationCSVs) {
        await setReadTime(fastq);
    }
    setEpochOffset();

    // any annotation csv files that are already in the annotations folder are sent for parsing:

    /* sort the fastqs via these timestamps and push onto the appropriate deques */
    log(`  * Sorting available basecalnew references seenled and annotation files based on read times`);
    unsortedAnnotationCSVs
        .sort((a, b) => getReadTime(a)>getReadTime(b) ? 1 : -1)
        .forEach((f) => {
            addToParsingQueue(f);
            global.fastqsSeen.add(path.basename(f));
        });

    // any basecalled fastq files that are already in the basecalled folder but without a matching annotations
    // csv file are se.t for annotation:

    const annotationBasenames = unsortedAnnotationCSVs.map((name) => path.basename(name, '.csv'));
    const basecalledBasenames = unsortedBasecalledFastqs
        .filter( (fastqPath) => {
            const b = path.basename(fastqPath, '.fastq');
            return !annotationBasenames.includes(b)
        } );

    unsortedBasecalledFastqs
        .filter( (fastqPath) => annotationBasenames.includes(path.basename(fastqPath, '.fastq')) )
        .forEach((f) => {
            global.fastqsSeen.add(path.basename(f))
        });

    unsortedBasecalledFastqs
        .filter( (fastqPath) => !annotationBasenames.includes(path.basename(fastqPath, '.fastq')) )
        .sort((a, b) => getReadTime(a) > getReadTime(b) ? 1 : -1)
        .forEach((f) => {
            addToAnnotationQueue(f);
        });

    log`RAMPART start up FINISHED\n`;

    // testing an output pipeline:
    //const binFastaPipeline = new PipelineRunner(name, snakefilePath, configfilePath, configOptions, queue);

    return true;
};

module.exports = {startUp};

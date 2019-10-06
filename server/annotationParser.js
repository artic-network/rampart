const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const dsv = require('d3-dsv');
const Deque = require("collections/deque");
const { getReadTime } = require('./readTimes');
const { prettyPath, warn, log, verbose } = require('./utils');

/**
 * This file defines the global.parserQueue handler, which processes annotated
 * FASTQ files. Note that the data has already been partially extracted
 * from these files, and a corresponding entry is present in global.datastore
 *
 * global.parsingQueue contains objects of `[pointer, fileToMap]` where
 * the pointer defines the idx of the partial info in global.datastore.
 * global.parsingQueue is a `Deque`
 *
 */

const parsingQueue = new Deque();

parsingQueue.observeRangeChange( () => { annotationParser(); } );

const addToParsingQueue = (filename) => parsingQueue.push(filename);

async function parseAnnotations(fileToParse) {
    const annotations = await dsv.csvParse(fs.readFileSync(fileToParse).toString());

    verbose("annotation parser", `parsed annotation file, ${prettyPath(fileToParse)}: ${annotations.length} lines`);

    annotations.forEach( row => {
        if (row.best_reference === "*" || row.best_reference === "") {
            row.best_reference = "unmapped";
        }
    });

    return annotations;
}

let isRunning = false; // prevent this being called by parsingQueue.observeRangeChange() when parsingQueue.shift is called

const annotationParser = async () => {

    if (!isRunning && parsingQueue.length > 0) {
        isRunning = true;

        const fileToParse = parsingQueue.shift();
        const filenameStem = path.basename(fileToParse, '.csv');
        let annotations;
        
        verbose("annotation parser", `queue length: ${parsingQueue.length+1}. Parsing ${prettyPath(fileToParse)}`);
        verbose(`Parsing annotation for ${filenameStem}`)
        
        try {
            annotations = await parseAnnotations(fileToParse);
        } catch (err) {
            //console.trace(err);
            warn(`Error parsing file, ${fileToParse.split("/").slice(-1)[0]}: ${err}`);
        }
        
        await global.datastore.addAnnotations(filenameStem, annotations);

        isRunning = false;

        annotationParser(); // recurse
    }
};

module.exports = {
    addToParsingQueue
};

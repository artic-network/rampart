const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const dsv = require('d3-dsv');
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
const addToParsingQueue = (filename) => parsingQueue.push(filename);

async function parseAnnotations(fileToParse) {
    const annotations = await dsv.csvParse(fs.readFileSync(fileToParse).toString());

    verbose(`[parser] parsed annotation file, ${prettyPath(fileToParse)}: ${annotations.length} lines`);

    return annotations;
}

let isRunning = false; // only want one mapping thread at a time!
const annotationParser = async () => {

    if (isRunning) {
        verbose("[annotationParser] called but already running");
        return;
    }

    if (parsingQueue.length) {
        isRunning = true;
        let results;
        const fileToParse = parsingQueue.shift();
        try {
            verbose(`[parser] queue length: ${parsingQueue.length+1}. Parsing ${prettyPath(fileToParse)}`);
            const annotations = await parseAnnotations(fileToParse);

            const filenameStem = path.basename(fileToParse, '.csv');

            global.datastore.addAnnotations(filenameStem, annotations);

        } catch (err) {
            //console.trace(err);
            warn(`Error parsing file, ${fileToParse.split("/").slice(-1)[0]}: ${err}`);
        }
        isRunning = false;
        annotationParser(); // recurse
    }
};

module.exports = {
    annotationParser,
    addToParsingQueue
};

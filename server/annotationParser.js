/**
 * Code related to parsing an annotated CSV file & adding it to `global.datastore`
 */
const fs = require('fs');
const path = require('path');
const dsv = require('d3-dsv');
const Deque = require("collections/deque");
const { warn, trace, verbose } = require('./utils');
const { getTimeFromAnnotatedCSV } = require('./readTimes');
const { UNMAPPED_LABEL } = require('./config');

const parsingQueue = new Deque();
let isRunning = false; // prevent this being called by parsingQueue.observeRangeChange() when parsingQueue.shift is called

parsingQueue.observeRangeChange( () => { annotationParser(); } );

/**
 * An annotated CSV to add to the parsing queue
 * @param {string} filepath
 */
const addToParsingQueue = (filepath) => parsingQueue.push(filepath);

async function parseAnnotations(fileToParse) {
    const annotations = await dsv.csvParse(fs.readFileSync(fileToParse).toString());
    verbose(
        "annotation parser",
        `parsed annotation file, ${path.basename(fileToParse, '.csv')} (${annotations.length} lines)`
    );
    annotations.forEach((row) => {
        if (row.best_reference === "*" || row.best_reference === "") {
            row.best_reference = UNMAPPED_LABEL;
        }
    });
    return annotations;
}

/**
 * Parse the annotated CSV. Example header & first line:
 * read_name,read_len,start_time,barcode,best_reference,ref_len,start_coords,end_coords,num_matches,aln_block_len
 * 1e9b37d6-de17-4093-b871-6dc8fc37df63,502,2018-10-08T14:06:34Z,none,Yambuku|DRC|1976,18957,5283,5731,254,462 
 */
const annotationParser = async () => {

    if (!isRunning && parsingQueue.length > 0) {
        isRunning = true;

        const fileToParse = parsingQueue.shift();
        const filenameStem = path.basename(fileToParse, '.csv');
        let annotations;

        verbose("annotation parser", `Parsing annotation for ${filenameStem}`)
        verbose("annotation parser", `${parsingQueue.length} files remain in queue`);

        try {
            annotations = await parseAnnotations(fileToParse);
        } catch (err) {
            trace(err);
            warn(`Error parsing file, ${fileToParse.split("/").slice(-1)[0]}: ${err}`);
        }

        await global.datastore.addAnnotatedSetOfReads(filenameStem, annotations);

        isRunning = false;

        annotationParser(); // recurse
    }
};

module.exports = {
    addToParsingQueue
};

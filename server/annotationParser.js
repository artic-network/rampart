/*
 * Copyright (c) 2019 ARTIC Network http://artic.network
 * https://github.com/artic-network/rampart
 *
 * This file is part of RAMPART. RAMPART is free software: you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version. RAMPART is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 * See the GNU General Public License for more details. You should have received a copy of the GNU General Public License
 * along with RAMPART. If not, see <http://www.gnu.org/licenses/>.
 *
 */

/**
 * Code related to parsing an annotated CSV file & adding it to `global.datastore`
 */
const fs = require('fs');
const path = require('path');
const dsv = require('d3-dsv');
const Deque = require("collections/deque");
const { warn, verbose } = require('./utils');

const parsingQueue = new Deque();
let isRunning = false; // prevent this being called by parsingQueue.observeRangeChange() when parsingQueue.shift is called

parsingQueue.observeRangeChange( () => { annotationParser(); } );

/**
 * An annotated CSV to add to the parsing queue
 * @param {string} filepath
 */
const addToParsingQueue = (filepath) => parsingQueue.push(filepath);

async function parseAnnotations(fileToParse) {
    if (!fs.existsSync(fileToParse)) {
        warn(`Annotation file, ${fileToParse}, doesn't exist - skipping.`);
        return undefined;
    }
    const annotations = await dsv.csvParse(fs.readFileSync(fileToParse).toString());
    verbose(
        "annotation parser",
        `parsed annotation file, ${path.basename(fileToParse, '.csv')} (${annotations.length} lines)`
    );
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

        verbose("annotation parser", `Parsing annotation for ${filenameStem}`);
        verbose("annotation parser", `${parsingQueue.length} files remain in queue`);

        try {
            annotations = await parseAnnotations(fileToParse);
            if (annotations) {
                if (global.config.run.simulateRealTime && global.config.run.simulateRealTime > 0) {
                    verbose("annotation parser", `simulating real-time - pausing for ${global.config.run.simulateRealTime} seconds`);
                    // add a pause in to simulate running in real time. This is intended for when just passing the annotations which
                    // would otherwise load all at once.
                    await new Promise(resolve => setTimeout(resolve, global.config.run.simulateRealTime * 1000));
                }
                await global.datastore.addAnnotatedSetOfReads(filenameStem, annotations);
            }
        } catch (err) {
            warn(`Error parsing file, ${fileToParse.split("/").slice(-1)[0]}: ${err}`);
        }

        isRunning = false;

        annotationParser(); // recurse
    }
};

module.exports = {
    addToParsingQueue
};

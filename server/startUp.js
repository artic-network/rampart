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
 * Process existing datafiles (basecalled FASTQs + annotated CSVs)
 * Adds these (as appropriate, no duplicates) to annotation & parsing queues.
 */
const processExistingData = async () => {
    log("Scanning data already present");

    /* Collect basecalled FASTQs */
    const fastqs = await getFilesFromDirectory(global.config.run.basecalledPath, 'fastq');

    const pathsOfBasecalledFastqs = fastqs.sort((a, b) => {
        // attempt to sort using a numerical field
        const regex = /(\d+)\.fastq/;
        const ai = a.match(regex);
        const bi = b.match(regex);

        if (ai && ai.length > 1 && bi && bi.length > 1) {
            return parseInt(ai[1], 10) - parseInt(bi[1], 10);
        }

        // no numerical fields so sort alphabetically
        return a.localeCompare(b);
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
            // attempt to sort using a numerical field
            const regex = /(\d+)\.csv/;
            const ai = a.match(regex);
            const bi = b.match(regex);

            if (ai && ai.length > 1 && bi && bi.length > 1) {
                return parseInt(ai[1], 10) - parseInt(bi[1], 10);
            }

            // no numerical fields so sort alphabetically
            return a.localeCompare(b);
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

    /* For those FASTQs without a corresponding annotated CSV, add them to `global.pipelineRunners.annotation`
    and to `globals.filesSeen` */
    /* TODO - we could sort these based on time stamps if we wished */
    pathsOfBasecalledFastqs.forEach((f) => {
        const basename = path.basename(f, '.fastq');
        if (global.filesSeen.has(basename)) {
            return; /* annotated CSV present (added above) */
        }
        global.pipelineRunners.annotation.addToQueue({
            name: `Annotating ${basename}`,
            input_path: global.config.run.basecalledPath,
            output_path: global.config.run.annotatedPath,
            filename_stem: basename
        });
        global.filesSeen.add(basename);
    });

    return true;
};

module.exports = {processExistingData};



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

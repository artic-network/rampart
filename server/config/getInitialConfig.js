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
 * ------------------------------------------------------------------------
 * Functions related to the initial parsing of the config files
 * ------------------------------------------------------------------------
 */

const fs = require('fs');
const path = require('path');
const { UNMAPPED_LABEL } = require("../magics");
const { ensurePathExists, normalizePath, getAbsolutePath, log, verbose, warn, fatal, getProtocolsPath } = require("../utils");
const { newSampleColour } = require("../colours");
const { setUpPipelines } = require("./pipeline");
const { modifySamplesAndBarcodes } = require("./modify");
const { readConfigFile, findConfigFile, assert, setBarcodesFromFile } = require("./helpers");

const DEFAULT_PROTOCOL_PATH = "protocols/default";
const PROTOCOL_FILENAME= "protocol.json";
const GENOME_CONFIG_FILENAME= "genome.json";
const PRIMERS_CONFIG_FILENAME = "primers.json";
const PIPELINES_CONFIG_FILENAME = "pipelines.json";
const RUN_CONFIG_FILENAME = "run_configuration.json";
const BARCODES_TO_SAMPLE_FILENAME = "barcodes.csv";

/**
 * Create initial config file from command line arguments - Note that
 * No data has been processed at this point.
 *
 * This will take configuration in the following order:
 *
 * [RAMPART_ROOT]/protocols/default
 * [PROTOCOL_PATH]/
 * current working directory/
 *
 * the PROTOCOL_PATH is specified as an environment variable `RAMPART_PROTOCOL` or as a
 * command line option `--protocol`
 *
 * Configuration files looked for:
 * `genome.json` - a description of the layout of genes in the genome. Used for visualized
 *      the coverage maps.
 *
 * `primers.json` - a description of the location of amplicons in the current protocol
 *      (for visualization).
 *
 * `pipelines.json` - a list of pipelines available with paths to the Snakemake files. One
 *      pipeline named 'annotator' is used to process reads for RAMPART and must be
 *      present. Other pipelines are used for post-RAMPART processing and analysis.
 *
 * `run_configuration.json` - This file provides the configuration for the current run
 *      (e.g., mapping of barcodes to samples, title of run, descriptions etc). It will
 *      usually be in the current working directory.
 *
 * Some of these options may also be overridden using command line options such as
 * `--barcodeNames`, `--title`, `--basecalledPath`
 *
 */
function getInitialConfig(args) {
    const pathCascade = setUpPathCascade(args);
    console.log(pathCascade);

    const config = {};
    config.protocol = readConfigFile(pathCascade, PROTOCOL_FILENAME);
    config.genome = readConfigFile(pathCascade, GENOME_CONFIG_FILENAME);
    config.genome.referencePanel = [{
        name: UNMAPPED_LABEL,
        description: "Reads that didn't map to any reference",
        display: true
    }];
    config.primers = readConfigFile(pathCascade, PRIMERS_CONFIG_FILENAME);
    config.pipelines = readConfigFile(pathCascade, PIPELINES_CONFIG_FILENAME);
    config.run = {
        title: `Started @ ${(new Date()).toISOString()}`,
        annotatedPath: "annotations",
        clearAnnotated: false,
        simulateRealTime: 0,
        samples: [],
        ...readConfigFile(pathCascade, RUN_CONFIG_FILENAME)
    };

    /* override any sample - barcode links via a provided barcodes CSV file */
    const barcodeFile = findConfigFile(pathCascade, BARCODES_TO_SAMPLE_FILENAME);
    if (barcodeFile) {
        setBarcodesFromFile(config, barcodeFile);
    }

    setUpDisplaySettings(config);
    modifyConfigViaCommandLineArguments(config, args);
    sortOutPaths(config);
    const pipelineRunners = setUpPipelines(config, args, pathCascade);
    giveSamplesColours(config);
    validate(config);

    if (config.run.clearAnnotated){
        log("Flag: 'Clearing annotation directory' enabled");
    }
    if (config.run.simulateRealTime > 0){
        log(`Simulating real-time appearance of reads every ${config.run.simulateRealTime} seconds`);
    }

    return {config, pipelineRunners};
};


/** */
function setUpPathCascade(args) {
    const serverDir = __dirname;
    const rampartSourceDir = serverDir.substring(0, serverDir.length - 14); // no trailing slash
    const defaultProtocolPath = getAbsolutePath(DEFAULT_PROTOCOL_PATH, {relativeTo: rampartSourceDir});
    //verbose("config", `Default protocol path: ${defaultProtocolPath}`);

    const pathCascade = [
        normalizePath(defaultProtocolPath) // always read config from the default protocol (but overwrite with other data as available)
    ];

    const protocolArray = args.protocol || (process.env.RAMPART_PROTOCOL ? process.env.RAMPART_PROTOCOL.split(" ") : []);
    for (const userProtocol of protocolArray) {
        /* First we check if it's set as a "rampart" protocol (e.g. via `rampart protocols add ...`) */
        if (!userProtocol.includes('/') && fs.existsSync(path.join(getProtocolsPath(), userProtocol))) {
            verbose("config", `Found RAMPART protocol for ${userProtocol}`);
            pathCascade.push(normalizePath(path.join(getProtocolsPath(), userProtocol)));
        } else {
            const userProtocolPath = getAbsolutePath(userProtocol, {relativeTo: process.cwd()});
            if (fs.existsSync(userProtocolPath)) {
              pathCascade.push(normalizePath(userProtocolPath));
            } else {
              warn(`Couldn't identify the requested protocol "${userProtocol}"! Attempting to carry on...`)
            }
        }
    }

    pathCascade.push("./"); // add current working directory

    pathCascade.forEach((p, i) => {
        verbose("config", `path cascade ${i}: ${p}`);
    })
    return pathCascade;
}

/* add in colours (this lends itself nicely to one day allowing them to be specified 
    in the config - the reason we don't yet do this is that colours which aren't in
    the colour picker will cause problems. */
function giveSamplesColours(config) {
    config.run.samples.forEach((s, i) => {
        s.colour = newSampleColour(s.name);
    })
}

function modifyConfigViaCommandLineArguments(config, args) {
    // add in / update barcode names provided on the arguments
    if (args.barcodeNames) {
        const newBarcodesToSamples = [];
        args.barcodeNames.forEach((raw) => {
            let [barcode, name] = raw.split('=');
            if (!name) name=barcode;
            newBarcodesToSamples.push([barcode, name]);
        });
        modifySamplesAndBarcodes(config, newBarcodesToSamples);
    }

    /* overwrite any title with a command-line specified one */
    if (args.title) {
        config.run.title = args.title;
    }

    /* overwrite any JSON defined path with a command line arg */
    if (args.basecalledPath) {
        config.run.basecalledPath = args.basecalledPath;
    }

    if (args.annotatedDir) {
        config.run.annotatedPath = args.annotatedDir;
    }

    if (args.clearAnnotated) {
        config.run.clearAnnotated = args.clearAnnotated;
    }
    if (args.simulateRealTime) {
        config.run.simulateRealTime = args.simulateRealTime;
    }

    if (args.referencesLabel) {
        config.display.referencesLabel = args.referencesLabel;
    }
}

function sortOutPaths(config) {
    if (!config.run.basecalledPath) {
        fatal(`No directory of basecalled reads specified in startup configuration`)
    }
    config.run.basecalledPath = normalizePath(getAbsolutePath(config.run.basecalledPath, {relativeTo: process.cwd()}));
    config.run.annotatedPath = normalizePath(getAbsolutePath(config.run.annotatedPath, {relativeTo: process.cwd()}));
    ensurePathExists(config.run.basecalledPath, {make: false});
    ensurePathExists(config.run.annotatedPath, {make: true});
    config.run.workingDir = process.cwd();
    verbose("config", `Basecalled path: ${config.run.basecalledPath}`);
    verbose("config", `Annotated  path: ${config.run.annotatedPath}`);
    verbose("config", `Current working directory: ${config.run.workingDir}`);
}

function setUpDisplaySettings(config) {
    /* display options */
    config.display = {
        numCoverageBins: 1000, /* how many bins we group the coverage stats into */
        readLengthResolution: 10,
        referenceMapCountThreshold: 5,
        maxReferencePanelSize: 10,
        coverageThresholds: {
            // ">200x": 200, "0x": 0
            // ">2000x": 2000, ">200x": 200, ">20x": 20, "0x": 0
            ">1000x": 1000, ">100x": 100, ">10x": 10, "0x": 0
        },
        filters: {},
        // filters: {"maxReadLength": 600}, // TMP TODO
        relativeReferenceMapping: false,
        logYAxis: false
    };

    // Add any display options from the protocol config file
    if (config.protocol.displayOptions) {
        config.display = { ...config.display, ...config.protocol.displayOptions };
    }

    // Add any display options options from the run config file
    if (config.run.displayOptions) {
        config.display = { ...config.display, ...config.run.displayOptions };
    }
}

function validate(config) {

    if (config.run.samples) {
        // TODO: error checking
    }

    // todo - check config objects for correctness
    assert(config.genome, "No genome description has been provided");
    assert(config.genome.label, "Genome description missing label");
    assert(config.genome.length, "Genome description missing length");
    assert(config.genome.genes, "Genome description missing genes");
}

module.exports = {
  getInitialConfig
}

#!/usr/bin/env node

const server = require("./server/server");
const { parser } = require("./server/args");
const { getInitialConfig } = require("./server/config/getInitialConfig");
const { processExistingData } = require("./server/startUp");
const { startBasecalledFilesWatcher } = require("./server/watchBasecalledFiles");
const Datastore = require("./server/datastore").default;
const { fatal, trace } = require('./server/utils');
const { setUpAnnotationRunner } = require("./server/annotator");

const main = async () => {
    try {
        const args = parser.parseArgs();
        if (args.verbose) global.VERBOSE = true;
        
        global.config = getInitialConfig(args);
        global.datastore = new Datastore();
        global.filesSeen = new Set(); /* files (basenames) seen (FASTQ or CSV) */
        global.annotationRunner = setUpAnnotationRunner();

        server.run({devClient: args.devClient, ports: args.ports});

        await processExistingData();
        await startBasecalledFilesWatcher();

    } catch (err) {
        trace(err);
        fatal(`Fatal error: ${err.message}`);
    }
};

main();

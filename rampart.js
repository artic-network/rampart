#!/usr/bin/env node

const server = require("./server/server");
const { parser, ensureDefaultSubparser } = require("./server/args");
const { getInitialConfig } = require("./server/config/getInitialConfig");
const startUp = require("./server/startUp");
const { startBasecalledFilesWatcher } = require("./server/watchBasecalledFiles");
const Datastore = require("./server/datastore").default;
const { fatal, trace } = require('./server/utils');
const listProtocols = require("./server/protocols/list").default;
const addProtocols = require("./server/protocols/add").default;
const removeProtocols = require("./server/protocols/remove").default;


const main = async () => {

    ensureDefaultSubparser("run");
    const args = parser.parseArgs();
    if (args.verbose) global.VERBOSE = true;

    try {
        switch (args.subcommandName) {
            case "run":
                const {config, pipelineRunners} = getInitialConfig(args);
                global.config = config;
                global.pipelineRunners = pipelineRunners;
                global.datastore = new Datastore();
                global.filesSeen = new Set(); /* files (basenames) seen (FASTQ or CSV) */
        
                server.run({devClient: args.devClient, ports: args.ports});
        
                if (global.config.run.clearAnnotated) {
                  await startUp.removeExistingAnnotatedCSVs();
                } else {
                  await startUp.processExistingAnnotatedCSVs();
                }
                await startBasecalledFilesWatcher();
                break;
            case "protocols":
                if (args.protocolCommand === "list") listProtocols(args);
                if (args.protocolCommand === "add") await addProtocols(args);
                if (args.protocolCommand === "remove") removeProtocols(args);
                break;
            default:
                throw new Error("Unknown subcommand");
        }
    } catch (err) {
        trace(err);
        fatal(`Fatal error: ${err.message}`);
    }
};

main();

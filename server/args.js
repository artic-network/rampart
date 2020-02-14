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

const argparse = require('argparse');
const version = require('../package.json').version;

const parser = new argparse.ArgumentParser({
  version: version,
  addHelp: true,
  description: `RAMPART v${version}: Read Assignment, Mapping, and Phylogenetic Analysis in Real Time`,
  epilog: ``
});
const subparsers = parser.addSubparsers({title: "subcommands", dest: "subcommandName"});

/* -------------- RUN -- the main subparser ------------- */
const run = subparsers.addParser('run', {addHelp: true});
run.addArgument('--verbose', {action: "storeTrue",  help: "verbose output"});
run.addArgument('--ports', {type: 'int', nargs: 2, defaultValue: [3000, 3001], help: "The ports to talk to the client over. First: client delivery, i.e. what localhost port to access rampart via (default: 3000). Second: socket to transfer data over (default: 3001)"});
run.addArgument('--protocol', {metavar: 'name', help: "name(s) of protocol(s) to use / path(s) to directory containing protocol config files", nargs: '*'});

/* -------------- RUN // CONFIG OPTIONS -------------------- */
const config = run.addArgumentGroup({title: 'Config commands', description: "Override options from config files"});
config.addArgument('--title', {help: "experiment title"});
config.addArgument('--basecalledPath', {help: "path to basecalled FASTQ directory (default: don't annotate FASTQs)"});
config.addArgument('--annotatedPath', {help: "path to destination directory for annotation CSVs - will be created if it doesn't exist (default: './annotations')"});
config.addArgument('--referencesPath', {help: "path to a FASTA file containing a panel of reference sequences"});
config.addArgument('--referencesLabel', {help: "the reference header field to use as a reference label (if not just the reference name)"});
config.addArgument('--barcodeNames', {nargs: '+', help: "specify mapping of barcodes to sample names - e.g. 'BC01=Sample1' (can have more than one barcode mapping to the same name)"});
config.addArgument('--annotationOptions', {nargs: '+', help: "pass through config options to the annotation script (key=value pairs)"});

/* -------------- RUN // RUNTIME OPTIONS -------------------- */
const runtime = run.addArgumentGroup({title: 'Runtime commands', description: "Options to specify how RAMPART behaves"});
runtime.addArgument('--clearAnnotated', {action: "storeTrue", help: "remove any annotation files present when RAMPART starts up (force re-annotation of all FASTQs)"});
runtime.addArgument('--simulateRealTime', {type: 'int', defaultValue: 0, help: "simulate real-time annotation with given delay between files (default none)"});

/* ---------------- RUN // DEVELOPMENT OPTIONS -------------------- */
const development = run.addArgumentGroup({title: 'Development commands'});
development.addArgument('--devClient', {action: "storeTrue", help: "don't serve build (client)"});
development.addArgument('--mockFailures', {action: "storeTrue", help: "stochastic failures (annotating / parsing)"});



/* --------------- PROTOCOL REGISTRY  -------- */
const protocols = subparsers.addParser('protocols', {addHelp:true});
const protocolsSubparsers = protocols.addSubparsers({title: "subcommands", dest: "protocolCommand"});

const protocolsList = protocolsSubparsers.addParser("list",
    {description: "List the (locally) available protocols", addHelp: true}
)
protocolsList.addArgument('name', {nargs:"*", type:"string", help:"Limit output to these protocols"});
protocolsList.addArgument('--verbose', {action: "storeTrue",  help: "longform output"});


const protocolsAdd = protocolsSubparsers.addParser("add",
    {description: "Add a protocol", addHelp: true}
)
protocolsAdd.addArgument('name', {type: "string", help: "Protocol name. Will be a directory, so no spaces etc please!"});

/* allow us to _not_ use the registry if you provide a URL / filepath / etc */
const addGroup = protocolsAdd.addMutuallyExclusiveGroup()
addGroup.addArgument('--url', {type: "string", help: "URL to zip file of protocol"});
addGroup.addArgument('--local', {type: "string", help: "path to local zip file / directory"});

protocolsAdd.addArgument('--verbose', {action: "storeTrue",  help: "verbose output"});
protocolsAdd.addArgument('--subdir', {type: "string",  help: "Subfolder inside zip where the protocol is to be found. Only valid with --url and --local"});
protocolsAdd.addArgument(['-f', '--force'], {action: "storeTrue", help: "Overwrite existing protocol, if one exists"});
protocolsAdd.addArgument('--keepZip', {action: "storeTrue",  help: "Keep the zip file after extraction. Does not work with --local, where it's never removed!"});


const protocolsRemove = protocolsSubparsers.addParser("remove",
    {description: "Update the protocol registry with available ARTIC protocols", addHelp: true}
)
protocolsRemove.addArgument('name', {nargs:"+", type:"string", help:"Protocols to remove"});
protocolsRemove.addArgument('--verbose', {action: "storeTrue",  help: "verbose output"});

// const protocolsUpdate = protocolsSubparsers.addParser("update",
//     {description: "Update the protocol registry with available ARTIC protocols", addHelp: true}
// )



/** Historically, RAMPART didn't have subparsers. This function will allow us to run
 * RAMPART using the old syntax by creating a default subparser if none is specified
 * https://stackoverflow.com/questions/6365601/default-sub-command-or-handling-no-sub-command-with-argparse
 */
const ensureDefaultSubparser = (name) => {
    /*  */
    for (let arg of process.argv.slice(1)) {
        if (['-h', '--help', '--version'].includes(arg)) {// global help if no subparser
            return;
        }
    }
    for (let x of Object.keys(subparsers.choices)) {
        if (process.argv.slice(1).includes(x)) {
            return;
        }
    }
    process.argv.splice(2, 0, name);
}

module.exports = {
  parser,
  ensureDefaultSubparser
};

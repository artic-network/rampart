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
parser.addArgument('--verbose', {action: "storeTrue",  help: "verbose output"});
parser.addArgument('--ports', {type: 'int', nargs: 2, defaultValue: [3000, 3001], help: "The ports to talk to the client over. First: client delivery, i.e. what localhost port to access rampart via (default: 3000). Second: socket to transfer data over (default: 3001)"});
parser.addArgument('--protocol', {help: "path to a directory containing protocol config files"});

/* ----------------- CONFIG OPTIONS -------------------- */
const config = parser.addArgumentGroup({title: 'Config commands', description: "Override options from config files"});
config.addArgument('--title', {help: "experiment title"});
config.addArgument('--basecalledPath', {help: "path to basecalled FASTQ directory (default: don't annotate FASTQs)"});
config.addArgument('--annotatedPath', {help: "path to destination directory for annotation CSVs - will be created if it doesn't exist (default: './annotations')"});
config.addArgument('--referencesPath', {help: "path to a FASTA file containing a panel of reference sequences"});
config.addArgument('--referencesLabel', {help: "the reference header field to use as a reference label (if not just the reference name)"});
config.addArgument('--barcodeNames', {nargs: '+', help: "specify mapping of barcodes to sample names - e.g. 'BC01=Sample1' (can have more than one barcode mapping to the same name)"});
config.addArgument('--annotationOptions', {nargs: '+', help: "pass through config options to the annotation script (key=value pairs)"});

const runtime = parser.addArgumentGroup({title: 'Runtime commands', description: "Options to specify how RAMPART behaves"});
runtime.addArgument('--clearAnnotated', {action: "storeTrue", help: "remove any annotation files present when RAMPART starts up (force re-annotation of all FASTQs)"});
runtime.addArgument('--simulateRealTime', {type: 'int', defaultValue: 0, help: "simulate real-time annotation with given delay between files (default none)"});

/* ----------------- DEVELOPMENT -------------------- */
const development = parser.addArgumentGroup({title: 'Development commands'});
development.addArgument('--devClient', {action: "storeTrue", help: "don't serve build (client)"});
development.addArgument('--mockFailures', {action: "storeTrue", help: "stochastic failures (annotating / parsing)"});

/* ----------------- DEPRECATED -------------------- */
// const deprecated = parser.addArgumentGroup({title: 'Deprecated commands'});
// config.addArgument('--referenceConfigPath', {help: "JSON reference config"});

module.exports = {
  parser
};

const argparse = require('argparse');
const version = require('../package.json').version;

const parser = new argparse.ArgumentParser({
  version: version,
  addHelp: true,
  description: `RAMPART v${version}: Read Assignment, Mapping, and Phylogenetic Analysis in Real Time`,
  epilog: `
  RAMPART is curently under development!
  `
});
parser.addArgument('--verbose', {action: "storeTrue",  help: "verbose output"});
parser.addArgument('--ports', {type: 'int', nargs: 2, defaultValue: [3000, 3001], help: "The ports to talk to the client over. First: client delivery, i.e. what localhost port to access rampart via (default: 3000). Second: socket to transfer data over (default: 3001)"});
parser.addArgument('--protocol', {help: "path to a directory containing protocol config files"});

/* ----------------- CONFIG OPTIONS -------------------- */
const config = parser.addArgumentGroup({title: 'Config commands', description: "Override options from config files"});
config.addArgument('--title', {help: "experiment title"});
config.addArgument('--basecalledPath', {help: "path to basecalled FASTQ directory (default: don't annotate FASTQs)"});
config.addArgument('--annotatedDir', {help: "destination directory for annotation CSVs (default: './annotations')"});
config.addArgument('--barcodeNames', {nargs: '+', help: "specify mapping of barcodes to sample names - e.g. 'BC01=Sample1' (can have more than one barcode mapping to the same name)"})
config.addArgument('--annotationConfig', {nargs: '+', help: "pass through config options to the annotation script (key=value pairs)"})

const runtime = parser.addArgumentGroup({title: 'Runtime commands', description: "Options to specify how RAMPART behaves"});
runtime.addArgument('--clearAnnotated', {action: "storeTrue", help: "remove any annotation files present when RAMPART starts up (force re-annotation of all FASTQs)"});
runtime.addArgument('--simulateRealTime', {type: 'int', defaultValue: 10, help: "simulate real-time annotation with given delay between files"});

/* ----------------- DEVELOPMENT -------------------- */
const development = parser.addArgumentGroup({title: 'Development commands'});
development.addArgument('--devClient', {action: "storeTrue", help: "don't serve build (client)"})
development.addArgument('--mockFailures', {action: "storeTrue", help: "stochastic failures (annotating / parsing)"});

/* ----------------- DEPRECATED -------------------- */
// const deprecated = parser.addArgumentGroup({title: 'Deprecated commands'});
// config.addArgument('--referencePanelPath', {help: "FASTA reference panel"});
// config.addArgument('--referenceConfigPath', {help: "JSON reference config"});

module.exports = {
  parser
};

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

/* ----------------- CONFIG OPTIONS -------------------- */
const config = parser.addArgumentGroup({title: 'Config commands', description: "These options can all be specified in the GUI"});
config.addArgument('--basecalledDir', {help: "basecalled FASTQ directory"});
config.addArgument('--annotatedDir', {help: "annotated FASTQ directory"});
config.addArgument('--title', {help: "experiment title"});
config.addArgument('--barcodeNames', {nargs: '+', help: "barcode=name, e.g. BC01=kikwit. Can have more than one."})

/* ----------------- DEVELOPMENT -------------------- */
const development = parser.addArgumentGroup({title: 'Development commands'});
development.addArgument('--emptyAnnotated', {action: "storeTrue", help: "remove any annotated files present when rampart starts up"});
development.addArgument('--devClient', {action: "storeTrue", help: "Don't serve build (client)"})
development.addArgument('--mockFailures', {action: "storeTrue", help: "stochastic failures (annotating / parsing)"});

/* ----------------- DEPRECATED -------------------- */
const deprecated = parser.addArgumentGroup({title: 'Deprecated commands'});
config.addArgument('--referencePanelPath', {help: "FASTA reference panel"});
config.addArgument('--referenceConfigPath', {help: "JSON reference config"});

module.exports = {
  parser
};

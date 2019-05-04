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
config.addArgument('--basecalledDir', {help: "basecalled directory"});
config.addArgument('--demuxedDir', {help: "demuxed directory"});
config.addArgument('--title', {help: "experiment title"});
config.addArgument('--referencePanelPath', {help: "FASTA reference panel"});
config.addArgument('--referenceConfigPath', {help: "JSON reference config"});
config.addArgument('--barcodeNames', {nargs: '+', help: "barcode=name, e.g. BC01=kikwit. Can have more than one."})

/* ----------------- DEVELOPMENT -------------------- */
const development = parser.addArgumentGroup({title: 'Development commands'});
development.addArgument('--emptyDemuxed', {action: "storeTrue", help: "remove any demuxed files present when rampart starts up"});
development.addArgument('--devClient', {action: "storeTrue", help: "Don't serve build (client)"})
development.addArgument('--mockFailures', {action: "storeTrue", help: "stochastic failures (mapping / demuxing / basecalling)"});


/* ----------------- DEPRECATED -------------------- */
const deprecated = parser.addArgumentGroup({title: 'Deprecated commands'});
deprecated.addArgument('--config', {required: true, help: "path to JSON configuration file"});
deprecated.addArgument('--subsetFastqs', {action: "storeTrue", help: "Development flag -- only considers subset of FASTQs for speed reasons"});
deprecated.addArgument('--startWithDemuxedReads', {action: "storeTrue", help: "Development flag."});
deprecated.addArgument('--relaxedDemuxing', {action: "storeTrue", help: "Development flag -- don't require matching barcodes to demux."});


module.exports = {
  parser
};

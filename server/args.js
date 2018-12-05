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
parser.addArgument('--config', {required: true, help: "path to JSON configuration file"});
parser.addArgument('--subsetFastqs', {action: "storeTrue", help: "Development flag -- only considers subset of FASTQs for speed reasons"});
parser.addArgument('--mockFailures', {action: "storeTrue", help: "Development flag -- stochastically fail to run guppy / porechop / mapping"});
parser.addArgument('--startWithDemuxedReads', {action: "storeTrue", help: "Development flag."});
parser.addArgument('--relaxedDemuxing', {action: "storeTrue", help: "Development flag -- don't require matching barcodes to demux."});
parser.addArgument('--emptyDemuxed', {action: "storeTrue", help: "Development flag -- remove any demuxed files present when rampart starts up"});

module.exports = {
  parser
};

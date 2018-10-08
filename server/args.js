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

module.exports = {
  parser
};

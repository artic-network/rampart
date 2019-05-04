const server = require("./server/server");
const { parser } = require("./server/args");
const getInitialConfig = require("./server/config").getInitialConfig;
const { startUp } = require("./server/startUp");

/* make some globals available everywhere */
const args = parser.parseArgs();
if (args.verbose) global.VERBOSE = true;
if (args.mockFailures) global.MOCK_FAILURES = true;
global.io = undefined;
global.config = getInitialConfig(args)
global.datastore = {};
global.barcodesSeen = new Set();
global.haveBeenSeen = new Set();


const main = async () => {
  await startUp({emptyDemuxed: args.emptyDemuxed}); /* block until we've read the appropriate files */
  const app = await server.run({devClient: args.devClient}); // eslint-disable-line
}

main();

const server = require("./server/server");
const { parser } = require("./server/args");
const getInitialConfig = require("./server/config").getInitialConfig;
const { startUp } = require("./server/startUp");
const { startBasecalledFilesWatcher } = require("./server/watchBasecalledFiles");

/* make some globals available everywhere */
const args = parser.parseArgs();
args.emptyDemuxed = true; // TODO!
if (args.verbose) global.VERBOSE = true;
if (args.mockFailures) global.MOCK_FAILURES = true;
global.barcodesObserved = new Set();
global.config = getInitialConfig(args)
global.datastore = {};
global.barcodesSeen = new Set();
global.haveBeenSeen = new Set();


const main = async () => {
  const app = await server.run({devClient: args.devClient}); // eslint-disable-line
  const success = await startUp({emptyDemuxed: args.emptyDemuxed})
  if (success) await startBasecalledFilesWatcher();
}

main();

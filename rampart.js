const server = require("./server/server");
const { parser } = require("./server/args");
const getInitialConfig = require("./server/config").getInitialConfig;
const { startUp } = require("./server/startUp");
const { startBasecalledFilesWatcher } = require("./server/watchBasecalledFiles");
const Datastore = require("./server/datastore").default;

/* make some globals available everywhere */
const args = parser.parseArgs();
if (args.verbose) global.VERBOSE = true;

global.config = getInitialConfig(args);
global.datastore = new Datastore();
global.fastqsSeen = new Set();


const main = async () => {
  server.run({devClient: args.devClient, ports: args.ports});
  const success = await startUp();
  if (success) await startBasecalledFilesWatcher();
};

main();

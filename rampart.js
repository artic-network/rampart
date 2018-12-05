const server = require("./server/server");
const { parser } = require("./server/args");
const { parseConfig } = require("./server/config");
const Deque = require("collections/deque");
const { mapper } = require("./server/mapper");
const { demuxer } = require("./server/demuxer");
const { startUp } = require("./server/startUp");
const { startGuppyWatcher } = require("./server/guppyWatcher");
const { sleep } = require("./server/utils");

/* make some globals available everywhere */
global.args = parser.parseArgs();
global.config = parseConfig(global.args);
global.haveBeenSeen = new Set();
global.demuxQueue = new Deque();
global.mappingQueue = new Deque();
global.mappingResults = new Deque();
global.scriptStartTime = Date.now();

const startWatchers = () => {
  /* as things get pushed onto the deques, we want to spawn the
  appropriate processes (e.g. guppy, porechop).
  As things are processed, they are shifted off one deque and pushed
  onto another! */
  global.demuxQueue.addRangeChangeListener(() => demuxer());
  global.mappingQueue.addRangeChangeListener(() => mapper());

  // start watchers
  demuxer();
  mapper();
  startGuppyWatcher();
}


const main = async () => {
  await startUp(); /* block until we've read the appropriate files */
  /* Listen on localhost and process requests from the client */
  const app = server.run({}); // eslint-disable-line
  await sleep(200);
  startWatchers();
}

main();

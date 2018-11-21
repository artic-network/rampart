const server = require("./server/server");
const { parser } = require("./server/args");
const { parseConfig } = require("./server/config");
const Deque = require("collections/deque");
const { mapper } = require("./server/mapper");
const { demuxer } = require("./server/demuxer");
const { startUp } = require("./server/startUp");

/* make some globals available everywhere */
global.args = parser.parseArgs();
global.config = parseConfig(global.args);
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
}


const main = async () => {
  await startUp(); /* block until we've read the appropriate files */
  startWatchers();
  /* Listen on localhost and process requests from the client */
  const app = server.run({}); // eslint-disable-line
}

main();

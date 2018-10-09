const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

let firstNanoporeTimestamp;

const error = (res, msg) => {
  res.statusMessage = msg;
  console.warn("WARNING", res.statusMessage);
  res.status(500).end();
  return;
}

const run = ({args, config, mappingResults}) => {
  const app = express()
  app.use(cors())

  app.get('/test', (req, res) => {
    console.log("API test request received");
    res.json({"serverAlive": true})
  });

  /* INITIAL REQUEST FROM FRONTEND - note that many reads may be ready, this is just to init the web app */
  app.get('/requestRunInfo', (req, res) => {
    console.log("SERVER: Client initialising. Sending info & annotation data.")
    res.json(global.config);
  });

  /* REQUEST AVAILABLE READS */
  app.get('/requestReads', (req, res) => {
    let nAvailable = global.mappingResults.length; // the number of mapped guppy-called FASTQ files
    // console.log("SERVER: Request reads.", nAvailable, "are available")

    if (nAvailable === 0) {
      res.statusMessage = 'No reads available.'
      return res.status(500).end();
    }

    /* the first read mapped is taken as the run start timestamp */
    if (!firstNanoporeTimestamp) {
      firstNanoporeTimestamp = (new Date(global.mappingResults[0].timeStamp)).getTime();
      console.log("firstNanoporeTimestamp", firstNanoporeTimestamp)
    }

    /* how many reads should we send to the client? we want to do this in "real time",
    so only send reads that have been generated in the time this script has been run
    That is, don't send reads from 5min into the capture if the script's been running
    for 20seconds! */

    /* TODO if a client reconnects (refreshes) then it never sees the previously sent JSONs */

    const durationThisScriptHasBeenRunning = Date.now() - global.scriptStartTime;
    const ret = [];
    for (let i = 0; i < nAvailable; i++) {
      const readTime = (new Date(global.mappingResults.peek().timeStamp)).getTime() - firstNanoporeTimestamp;
      if (readTime > durationThisScriptHasBeenRunning) {
        break;
      }
      ret.push(global.mappingResults.shift());
    }

    if (ret.length) {
      console.log("Sending ", ret.length, "mapped FASTQs for visualisation.");
      res.json(ret);
    } else {
      const nextReadTime = parseInt(((new Date(global.mappingResults.peek().timeStamp)).getTime() - firstNanoporeTimestamp)/1000, 10);
      console.log(`*** Not sending data because the next read was after ${nextReadTime}s of capture, and this script has only been running for ${parseInt(durationThisScriptHasBeenRunning/1000, 10)}s. ***`)
      res.statusMessage = 'No reads available.'
      return res.status(500).end();
    }
  })

  /* serve the html & javascript */
  /* THIS IS FOR THE PRODUCTION, BUILT BUNDLE. USE npm run start FOR DEVELOPMENT */
  // https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/template/README.md#deployment
  app.use(express.static(path.join(__dirname, "..", 'build')));
  app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, "..", 'build', 'index.html'));
  });

  const port = process.env.PORT || 3001;
  app.set('port', port);
  app.listen(app.get('port'), () => {
    console.log(`\n\n---------------------------------------------------------------------------`);
    console.log(`RAMPART daemon & server running (listening on port ${port})`);
    console.log(`Now run run "npm run start" to start the web app`);
    console.log(`---------------------------------------------------------------------------\n\n`);
  });
  return app;
}



module.exports = {
  run
};

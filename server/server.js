const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

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
    const ret = [];
    // console.log("SERVER: Request reads.", nAvailable, "are available")

    if (nAvailable === 0) {
      res.statusMessage = 'No (valid) reads to process.'
      return res.status(500).end();
    } else if (nAvailable > 5) {
      /* this stops a huge dump right at the start. Dev only. TODO */
      nAvailable = 5;
    }

    /* currently we just shift mapped data off the deque and send to the client
    But this means that if a client reconnects (refreshes) then it never sees the
    previously mapped stuff!.
    We should save these mapped files as JSONs, and process in the startUp() function.
    */
    for (let i = 0; i < nAvailable; i++) {
      ret.push(global.mappingResults.shift());
    }
    console.log("Sending ", ret.length, "mapped FASTQs for visualisation.");

    res.json(ret);
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

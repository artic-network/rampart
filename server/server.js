const express = require('express')
const cors = require('cors')
// const fs = require('fs')
const path = require('path')

let firstTimestamp;
let mappingFilesPointer = 0; /* idx of global.mappingResults to send next */
const maxMappingFilesPerRequest = 5;

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
        console.log("\n\n\t\t*********************");
        console.log("SERVER: Client initialising. Sending info & annotation data.")
        res.json(global.config);
        if (mappingFilesPointer !== 0) {
          console.log("Restoring previously sent reads.")
          mappingFilesPointer = 0;
        }
        console.log("\t\t*********************\n\n");
    });

    /* REQUEST AVAILABLE READS */
    app.get('/requestReads', (req, res) => {
        let nAvailable = global.mappingResults.length; // the number of mapped guppy-called FASTQ files
        // console.log("SERVER: Request reads.", nAvailable, "are available. Pointer:", mappingFilesPointer);

        if (nAvailable === 0 || nAvailable <= mappingFilesPointer) {
            res.statusMessage = 'No reads available.'
            return res.status(500).end();
        }

        /* the first read mapped is taken as the run start timestamp */
        if (!firstTimestamp) {
            firstTimestamp = global.mappingResults[0].time;
            console.log("firstTimestamp", firstTimestamp)
        }

        /* how many reads should we send to the client? we want to do this in "real time",
        so only send reads that have been generated in the time this script has been run
        That is, don't send reads from 5min into the capture if the script's been running
        for 20seconds! */

        /* TODO if a client reconnects (refreshes) then it never sees the previously sent JSONs */

        // const durationThisScriptHasBeenRunning = Date.now() - global.scriptStartTime;
        const ret = [];
        while (mappingFilesPointer < nAvailable) {
          // const readTime = global.mappingResults[mappingFilesPointer].time - firstTimestamp;
          // if (readTime > durationThisScriptHasBeenRunning) {
          //     break;
          // }
          ret.push(global.mappingResults[mappingFilesPointer++]);
          if (ret.length >= maxMappingFilesPerRequest) {
            break;
          }
        }

        if (ret.length) {
            console.log("SERVER: Sending ", ret.length, "mapped FASTQs for visualisation.");
            res.json(ret);
        } else {
            // const nextReadTime = parseInt((global.mappingResults.peek().time - firstTimestamp)/1000, 10);
            // console.log(`*** Not sending data because the next read was after ${nextReadTime}s of capture, and this script has only been running for ${parseInt(durationThisScriptHasBeenRunning/1000, 10)}s. ***`)
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

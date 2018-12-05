const express = require('express')
const cors = require('cors')
const path = require('path')
const chalk = require('chalk');

const error = (res, msg) => {
    res.statusMessage = msg;
    console.warn(chalk.red("WARNING", res.statusMessage));
    res.status(500).end();
    return;
}

const run = ({args, config, mappingResults}) => {
    let mappingResultsPointer = 0; /* idx of global.mappingResults to send next */
    let clientHasConnected = false;

    const app = express()
    app.use(cors())

    app.get('/test', (req, res) => {
        console.log("API test request received");
        res.json({"serverAlive": true})
    });

    /* INITIAL REQUEST FROM FRONTEND - note that many reads may be ready, this is just to init the web app */
    app.get('/requestRunInfo', (req, res) => {
        console.log(chalk.blueBright.bold("\n\n\t\t*********************"));
        console.log(chalk.blueBright.bold("SERVER: Client initialising. Sending info & annotation data."));
        res.json(global.config);
        if (mappingResultsPointer !== 0) {
          console.log(chalk.blueBright.bold("Previously sent reads will be resent."));
          mappingResultsPointer = 0;
        }
        console.log(chalk.blueBright.bold("\t\t*********************\n\n"));
        clientHasConnected = true;
    });

    /* REQUEST AVAILABLE READS */
    app.get('/requestReads', (req, res) => {

        if (!clientHasConnected) {
            /* tell the client to re-initialise. This prevents out-of-sync bugs
            if the client was connected to a previous instance of the rampart daemon */
            res.statusMessage = 'force requestRunInfo'
            return res.status(500).end();
        }

        let nAvailable = global.mappingResults.length; // the number of mapped guppy-called FASTQ files
        // console.log("SERVER: Request reads.", nAvailable, "are available. Pointer:", mappingResultsPointer);
    
        if (nAvailable === 0 || nAvailable <= mappingResultsPointer) {
            res.statusMessage = 'No reads available.'
            return res.status(500).end();
        }
    
        const ret = [];
        while (mappingResultsPointer < nAvailable) {
            ret.push(global.mappingResults[mappingResultsPointer++]);
            if (ret.length >= global.config.maxMappingFilesPerRequest) {
                break;
            }
        }
    
        if (ret.length) {
            console.log(chalk.blueBright("SERVER: Sending ", ret.length, "mapped FASTQs for visualisation."));
            res.json(ret);
        } else {
            res.statusMessage = 'No reads available.'
            return res.status(500).end();
        }
    });

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
        console.log(chalk.blueBright.bold(`\n\n---------------------------------------------------------------------------`));
        console.log(chalk.blueBright.bold(`RAMPART daemon & server running (listening on port ${port})`));
        console.log(chalk.blueBright.bold(`Now run run "npm run start" to start the web app`));
        console.log(chalk.blueBright.bold(`---------------------------------------------------------------------------\n\n`));
    });
    return app;
}



module.exports = {
    run
};

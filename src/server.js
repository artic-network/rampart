const express = require('express')
const csv = require('csvtojson')
const cors = require('cors')
const fs = require('fs');
const path = require("path");

// const args = process.argv.slice(2);
// /* get plex from command line arguments */
// let plex = 1;
// for (let i = 0; i < args.length; i++) {
//   if (args[i].startsWith("--plex")) {
//     plex = parseInt(args[i].split("=")[1], 10)
//   }
// }

const readFilePaths = [];
const dataDir = path.join("data", "read_files"); // relative to the terminal when run, not where the source is located
fs.readdirSync(dataDir).forEach(file => {
  const filePath = path.join(dataDir, file);
  if (fs.lstatSync(filePath).isFile()) {
    readFilePaths.push(filePath)
  }
})
console.log("There are ", readFilePaths.length, "read files available.\n")
let readFilePathsIdx = 0;
let processingRequest = false;

const app = express()
app.use(cors())

app.get('/requestReads', (req, res) => {
  if (processingRequest) {
    return res.send('still not done with the last request.');
  }
  if (readFilePathsIdx + 1 === readFilePaths.length) {
    return res.send('data exhausted.');
  }
  processingRequest = true
  const data = [];
  csv({noheader: false})
    .fromFile(readFilePaths[readFilePathsIdx])
    .on('csv', (row) => {
      //          "channel",          "reference",  "start",              "end",                "identity"
      data.push([parseInt(row[0], 10), row[1],  parseInt(row[2], 10), parseInt(row[3], 10), parseInt(row[4], 10)])
    })
    .on('done', () => {
      res.json(data);
      processingRequest = false;
      readFilePathsIdx++;
    })
})

app.listen(3001, () => console.log('Development MinIon data generator running. Rampart Frontend should now work.'))

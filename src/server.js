const express = require('express')
const csv = require('csvtojson')
const cors = require('cors')
const fs = require('fs');
const path = require("path");

const readFilePaths = [];
const dataDir = path.join(__dirname, "..", "data", "read_files"); // relative to the terminal when run, not where the source is located
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

app.get('/requestRunInfo', (req, res) => {
  console.log("Begin new run")
  readFilePathsIdx = 0; /* reset */
  const annotation = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "ebola_annotation.json")));
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "run_info.json")));
  data.annotation = annotation;
  res.json(data);
});

app.get('/requestReads', (req, res) => {
  if (processingRequest) {
    return res.send('still not done with the last request.');
  }
  if (readFilePathsIdx + 2 === readFilePaths.length) {
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

/* serve the html & javascript */
// https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/template/README.md#deployment
app.use(express.static(path.join(__dirname, "..", 'build')));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, "..", 'build', 'index.html'));
});

app.set('port', process.env.PORT || 3001);
app.listen(app.get('port'), () => console.log('Development MinIon data generator running. Rampart Frontend should now work.'))

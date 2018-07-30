const express = require('express')
const cors = require('cors')
const fs = require('fs');
const path = require("path");

const app = express()
app.use(cors())

let filenamesRead = [];
let processingRequest = false;
const readDir = path.join(__dirname, "..", "data", "real_time_reads");

/* INITIAL REQUEST FROM FRONTEND - note that many reads may be ready, this is just to init the web app */
app.get('/requestRunInfo', (req, res) => {
  console.log("Client attaching. Sending info & annotation data.")
  const annotation = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "ebola_annotation.json")));
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "run_info.json")));
  data.annotation = annotation;
  filenamesRead = []; // frontend has restarted - it needs all the data!
  res.json(data);
});


/* REQUEST AVAILABLE READS */
app.get('/requestReads', (req, res) => {
  if (processingRequest) {
    res.statusMessage = 'Still processing previous request.'
    return res.status(500).end();
  }
  /* find "new" read files. Could be made async at some point */
  const ret = [];
  fs.readdirSync(readDir).forEach((file) => {
    if (file.endsWith(".json") && filenamesRead.indexOf(file) === -1) {
      try {
        ret.push(JSON.parse(fs.readFileSync(path.join(readDir, file), 'utf8')));
        filenamesRead.push(file)
      } catch (err) {
        console.log("Error processing file", file);
      }
    }
  });
  if (!ret.length) {
    res.statusMessage = 'No (valid) reads to process.'
    return res.status(500).end();
  }
  res.json(ret);
})


/* serve the html & javascript */
// https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/template/README.md#deployment
app.use(express.static(path.join(__dirname, "..", 'build')));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, "..", 'build', 'index.html'));
});

const port = process.env.PORT || 3001;
app.set('port', port);
app.listen(app.get('port'), () => {
  console.log(`RAMPART server listening & serving built bundle on http://localhost:${port}`);
  console.log(`For development of the client it's easier to run "npm run start"`);
});

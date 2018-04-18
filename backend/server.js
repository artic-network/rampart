const express = require('express')
const app = express()
const csv = require('csvtojson')
const cors = require('cors')

const args = process.argv.slice(2);
/* get plex from command line arguments */
let plex = 1;
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--plex")) {
    plex = parseInt(args[i].split("=")[1], 10)
  }
}

/* LOAD THE DUMMY DATA */
const data = [];
for (let i = 0; i < plex; i++) {
  data.push([])
}
csv({noheader:false})
  .fromFile('../data/reads_1M.csv')
  .on('csv', (row) => {
    // "reference","start","end","identity"
    for (let i = 0; i < plex; i++) {
      data[i].push([row[0], parseInt(row[1], 10), parseInt(row[2], 10), parseInt(row[3], 10)])
    }
  })
  .on('done', () => {
    console.log("FINISHED LOAD OF 1M FAKE CSV READS. MULTIPLEX: ", plex)
    // console.log(data[0].splice(0, 10))
    // console.log("...")
  })
/* END LOAD */

/* Mock 100 "new" reads from the minIon */
function getRandomReads(channelData) {
  /* there's some chance that nothing is read... */
  if (Math.random() < 0.3) {
    return []
  }
  /* else: */
  const averageNumReadsPerChannel = 500
  const start = Math.floor(Math.random() * channelData.length)
  let end = start + Math.floor(Math.random() * averageNumReadsPerChannel)
  if (end >= channelData.length) end = channelData.length
  return channelData.slice(start, end)
}


app.use(cors())

app.get('/getInitialData', (req, res) => {
  console.log("Initial data. Returning 10 reads.")
  res.json(data.map((d) => d.slice(0, 100)));
})

app.get('/getDataUpdate', (req, res) => {
  console.log("Additional Data. Sending additional reads.")
  res.json(data.map((d) => getRandomReads(d)))
})


app.listen(3001, () => console.log('Fake MinIon data generator running. Rampart Frontend should now work.'))

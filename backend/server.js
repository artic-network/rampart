const express = require('express')
const app = express()
const csv = require('csvtojson')
const cors = require('cors')

/* LOAD THE DUMMY DATA */
plex = 1;
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
    console.log("FINISHED LOAD OF FAKE CSV READS")
    // console.log(data[0].splice(0, 10))
    // console.log("...")
  })
/* END LOAD */

/* Mock "new" reads from the minIon */
function getRandomReads(channelData) {
  const start = Math.floor(Math.random() * channelData.length)
  let end = start + Math.floor(Math.random() * 10000)
  if (end >= channelData.length) end = channelData.length
  return channelData.slice(start, end)
}


app.use(cors())

app.get('/getInitialData', (req, res) => {
  console.log("Initial data. Returning 1000 reads.")
  res.json(data.map((d) => d.slice(0, 1000)));
})

app.get('/getDataUpdate', (req, res) => {
  console.log("Additional Data. Sending additional reads.")
  res.json(data.map((d) => getRandomReads(d)))
})


app.listen(3001, () => console.log('Fake MinIon data generator running. Rampart Frontend should now work.'))

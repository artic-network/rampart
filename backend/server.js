const express = require('express')
const app = express()
const csv = require('csvtojson')
const cors = require('cors')

/* LOAD THE DUMMY DATA */
let data = [[]];
csv({noheader:false})
  .fromFile('../data/reads_10K.csv')
  .on('csv', (row) => {
    // "reference","start","end","identity"
    data[0].push([row[0], parseInt(row[1], 10), parseInt(row[2], 10), parseInt(row[3], 10)])
  })
  .on('done', () => {
    console.log("FINISHED LOAD")
    console.log(data[0].splice(0, 10))
    console.log("...")
  })
/* END LOAD */

app.use(cors())

/* API "getInitialData" -> get data structure */
app.get('/getInitialData', (req, res) => {
  console.log("someone asked for initial data. sending")
  res.json(data.map((d) => d.splice(0, 5000)));
})


app.listen(3001, () => console.log('Example app listening on port 3001!'))

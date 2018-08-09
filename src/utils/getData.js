import crossfilter from "crossfilter"

const prefix = process.env.NODE_ENV === "development" ? "http://localhost:3001" : "";

const processTimeStamp = (timeStamp) => {
  const d = new Date(timeStamp);
  return d.getTime();
}

const processReadDataLine = (line, referenceLabels) => ({
  channel: line[1],
  reference: referenceLabels[line[2]-1],
  start: line[3],
  end: line[4],
  identity: line[5],
  length: line[4] - line[3] + 1,
  location: (line[3] + line[4]) / 2
})

/* could be moved to the server */
const addJSONToState = (state, setState, json) => {
  const newState = {...state};
  let firstTime = !newState.startTime;
  /* if we haven't yet had any reads, we have to initialise state... */
  if (firstTime) {
    newState.startTime = processTimeStamp(json[0].timeStamp);
    newState.nTotalReads = 0;
    newState.readsOverTime = [];
    newState.versions = [...Array(state.barcodes.length)].map(() => 1);
  }

  /* the JSON is an array of mapping datafiles */
  json.forEach((data) => {
    newState.nTotalReads += data.readData.length;
    let prevReadCount = 0;
    if (newState.readsOverTime.length) prevReadCount = newState.readsOverTime[newState.readsOverTime.length-1][1]
    newState.readsOverTime.push([
      parseInt((processTimeStamp(data.timeStamp) - newState.startTime)/1000, 10),
      prevReadCount + data.readData.length
    ]);
    /* summarise the reads per barcode */
    const readsPerBarcode = [...Array(state.barcodes.length)].map(() => []);
    data.readData.forEach((line) => {
      const d = processReadDataLine(line, state.references);
      readsPerBarcode[d.channel-1].push(d);


      //                        REF IDX    BARCODE
      state.refMatchPerBarcode[line[2]-1][line[1]]++

    });
    /* add the reads per barcode to the state as a crossfilter object */
    if (!newState.readsPerBarcode) { /* set up crossfilter */
      newState.readsPerBarcode = readsPerBarcode.map((d) => crossfilter(d));
    } else {
      /* add to crossfilter & +1 the versions as needed */
      newState.versions = readsPerBarcode.map((reads, idx) => {
        if (reads.length) {
          newState.readsPerBarcode[idx].add(reads);
          return newState.versions[idx] + 1;
        } else {
          return newState.versions[idx]
        }
      })
    }
  })

  if (firstTime) {
    /* we need to create dimensions / groups for each of the graphs.
    This only needs to be done once - it automagically updates! */
    newState.coveragePerChannel = newState.readsPerBarcode.map((r) =>
      r.dimension((d) => d.location)
        .group((d) => Math.ceil(d/1000)*1000) /* this makes a histogram with x values (bases) rounded to closest 1000 */
        .all()
    )
    newState.readLengthPerChannel = newState.readsPerBarcode.map((r) =>
      r.dimension((d) => d.length)
        .group((d) => Math.ceil(d/10)*10) /* this makes a histogram with x values (bases) rounded to closest 10 */
        .all()
    )
  }

  // bump versions
  newState.refMatchPerBarcodeVersion++


  newState.status = "Reads added...";
  setState(newState);
}

export const requestReads = (state, setState) => {
  /* don't fetch before the run info has arrived */
  if (!state.name) return;

  fetch(`${prefix}/requestReads`)
    .then((res) => {
      if (res.status !== 200) throw new Error(res.statusText);
      return res;
    })
    .then((res) => res.json())
    .then((json) => {
      addJSONToState(state, setState, json)
    })
    .catch((err) => {
      console.warn("requestReads:", err)
      setState({status: err});
    })
}

const createInitialState = (infoJson) => {
  const state = {
    name: infoJson.name,
    annotation: infoJson.annotation,
    barcodes: infoJson.barcodes,
    references: infoJson.references
  }
  state.refMatchPerBarcode = state.references.map((refName, refIdx) =>
    state.barcodes.map((barcodeName, barcodeIdx) => 0)
  )
  state.refMatchPerBarcodeVersion = 0;
  return state;
}

export const requestRunInfo = (state, setState) => {
  setState({status: "Querying server for data"})

  fetch(`${prefix}/requestRunInfo`)
    .then((res) => {
      if (res.status !== 200) throw new Error(res.statusText);
      return res;
    })
    .then((res) => res.json())
    .then((jsonData) => {
      const state = createInitialState(jsonData);
      console.log("Run info JSON:", jsonData)
      console.log("initial state:", state)
      setState({status: "Connected to server. Awaiting initial read data.", ...state})
    })
    .catch((err) => {
      console.warn("requestRunInfo:", err)
      setState({status: err});
    })
}

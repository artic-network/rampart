const prefix = process.env.NODE_ENV === "development" ? "http://localhost:3001" : "";
const genomeResolution = 100; // TODO: centralise
const readLengthResolution = 10; // TODO: centralise

const processTimeStamp = (timeStamp) => {
  const d = new Date(timeStamp);
  return d.getTime();
}

// const processReadDataLine = (line, referenceLabels) => ({
//   channel: line[1],
//   reference: referenceLabels[line[2]-1],
//   start: line[3],
//   end: line[4],
//   identity: line[5],
//   length: line[4] - line[3] + 1,
//   location: (line[3] + line[4]) / 2
// })

/* could be moved to the server */
const addJSONToState = (state, setState, json) => {
  const newState = {...state};

  /* if we haven't yet had any reads, we have to initialise timestamps via the first JSON */
  if (!newState.startTime) {
    newState.startTime = processTimeStamp(json[0].timeStamp);
    newState.readsOverTime = [];
    newState.versions = [...Array(state.barcodes.length)].map(() => 1);
  }

  /* the JSON is an array of mapping datafiles */
  let readsAdded = 0;
  json.forEach((data) => {
    let prevReadCount = 0;
    if (newState.readsOverTime.length) prevReadCount = newState.readsOverTime[newState.readsOverTime.length-1][1]
    newState.readsOverTime.push([
      parseInt((processTimeStamp(data.timeStamp) - newState.startTime)/1000, 10),
      prevReadCount + data.readData.length
    ]);
    readsAdded += data.readData.length;
    data.readData.forEach((line) => {
      //                        REF IDX    BARCODE
      state.refMatchPerBarcode[line[2]-1][line[1]]++
      state.readCountPerBarcode[line[1]]++;

      // start & end index, relative to genomeResolution
      const startIdx = Math.floor(line[3] / genomeResolution);
      const endIdx   = Math.ceil(line[4] / genomeResolution);
      for (let i=startIdx; i<=endIdx; i++) {
        state.coveragePerBarcode[line[1]][i]++
      }

      // read length distribution
      const readLengthBin = Math.floor((line[4] - line[3] + 1) / readLengthResolution);
      if (readLengthBin >= state.readLengthPerBarcode[line[1]].length) {
        console.error("must extend readLengthPerBarcode array")
      } else {
        state.readLengthPerBarcode[line[1]][readLengthBin]++
      }
    });
  })
  newState.dataVersion++
  newState.status = `Added ${readsAdded} reads`;
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
      console.log("requestReads:", err)
      setState({status: err});
    })
}

const initialiseArray = (n) =>
  Array.from(new Array(n), () => 0)

const createInitialState = (infoJson) => {
  const state = {
    name: infoJson.name,
    annotation: infoJson.annotation,
    barcodes: infoJson.barcodes,
    references: infoJson.references
  }

  const genomeLength = state.annotation.genome.length;
  const genomeParts = Math.ceil(genomeLength / genomeResolution);
  state.coveragePerBarcode = state.barcodes.map(() =>
    Array.from(new Array(genomeParts), () => 0)
  );
  state.refMatchPerBarcode = state.references.map((refName, refIdx) =>
    state.barcodes.map((barcodeName, barcodeIdx) => 0)
  )
  state.readCountPerBarcode = state.barcodes.map(() => 0);
  state.readLengthPerBarcode = state.barcodes.map(() => initialiseArray(parseInt(1000/readLengthResolution, 10)))
  state.dataVersion = 0;
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

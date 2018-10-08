import { genomeResolution, readLengthResolution } from "../magics";

const prefix = process.env.NODE_ENV === "development" ? "http://localhost:3001" : "";

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
const makeNewState = (oldState, json) => {
  const newState = {...oldState};

  /* if we haven't yet had any reads, we have to initialise timestamps via the first JSON */
  // debugger
  if (!newState.startTime) {
    newState.startTime = processTimeStamp(json[0].timeStamp);
    newState.readsOverTime = [];
    newState.versions = [...Array(oldState.barcodes.length)].map(() => 1);
  }

  /* the JSON is an array of mapping results, each one consisting of
  the reads from a single guppy-basecalled FASTQ file  */
  let readsAdded = 0;
  json.forEach((data) => {
    // console.log("DATA:", data)
    let prevReadCount = 0;
    if (newState.readsOverTime.length) {
      prevReadCount = newState.readsOverTime[newState.readsOverTime.length-1][1]
    }
    newState.readsOverTime.push([
      parseInt((processTimeStamp(data.timeStamp) - newState.startTime)/1000, 10),
      prevReadCount + data.readData.length
    ]);
    readsAdded += data.readData.length;
    data.readData.forEach((line) => {
      //                       BARCODE    REF IDX
      oldState.refMatchPerBarcode[line[0]][line[1]]++
      oldState.readCountPerBarcode[line[0]]++;


      // start & end index, relative to genomeResolution
      const startIdx = Math.floor(line[2] / genomeResolution);
      const endIdx   = Math.ceil(line[3] / genomeResolution);
      for (let i=startIdx; i<=endIdx; i++) {
        oldState.coveragePerBarcode[line[0]][i]++
      }

      // read length distribution
      const readLengthBin = Math.floor((line[3] - line[2] + 1) / readLengthResolution);
      if (readLengthBin >= oldState.readLengthPerBarcode[line[0]].length) {
        console.error("must extend readLengthPerBarcode array")
      } else {
        oldState.readLengthPerBarcode[line[0]][readLengthBin]++
      }
    });
  })
  newState.dataVersion++
  newState.status = `Added ${readsAdded} reads`;
  console.log("New state (after reads in)", newState)
  return newState;
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
      setState(makeNewState(state, json))
    })
    .catch((err) => {
      console.log("requestReads:", err)
      // setState({status: err});
    })
}

const initialiseArray = (n) =>
  Array.from(new Array(n), () => 0)

const createInitialState = (infoJson) => {
  console.log("JSON from server:", infoJson)
  const state = {
    name: infoJson.name,
    annotation: {genes: infoJson.reference.genes},
    barcodes: infoJson.barcodes,
    references: infoJson.referencePanel
  }

  /* process the amplicons (primer pairs) */
  if (infoJson.reference.amplicons) {
    state.annotation.amplicons = infoJson.reference.amplicons
      .sort((a, b) => {return a[0]<b[0] ? -1 : 1});
  }
  state.annotation.genome = {length: infoJson.reference.sequence.length};
  const genomeParts = Math.ceil(state.annotation.genome.length / genomeResolution);
  state.coveragePerBarcode = state.barcodes.map(() =>
    Array.from(new Array(genomeParts), () => 0)
  );
  state.refMatchPerBarcode = state.barcodes.map((barcodeName, barcodeIdx) =>
    state.references.map((refName, refIdx) => 0)
  )
  state.readCountPerBarcode = state.barcodes.map(() => 0);
  state.readLengthPerBarcode = state.barcodes.map(() => initialiseArray(parseInt(1000/readLengthResolution, 10)))
  state.dataVersion = 0;
  console.log("initial state:", state)
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
      setState({status: "Connected to server. Awaiting initial read data.", ...state})
    })
    .catch((err) => {
      console.warn("requestRunInfo:", err)
      setState({status: err});
    })
}

import { genomeResolution, readLengthResolution } from "../magics";

const prefix = process.env.NODE_ENV === "development" ? "http://localhost:3001" : "";

// const processTimeStamp = (timeStamp) => {
//   const d = new Date(timeStamp);
//   return d.getTime();
// }

const makeNewState = (oldState, json) => {
  /* Potentially move some of this to the server... */
  const newState = {...oldState};

  /* if we haven't yet had any reads, we have to initialise the "run start time" via the first JSON */
  if (!newState.startTime) {
//  newState.startTime = processTimeStamp(json[0].timeStamp);
    newState.startTime = json[0].time;
    newState.readsOverTime = [];
    newState.versions = [...Array(oldState.samples.length)].map(() => 1);
  }

  /* the JSON is an array of mapping results, each one consisting of
  the reads from a single guppy-basecalled FASTQ file  */
  let readsAdded = 0;
  json.forEach((data) => {
    // console.log("DATA FROM SERVER:", data)
    let prevReadCount = 0;
    if (newState.readsOverTime.length) {
      prevReadCount = newState.readsOverTime[newState.readsOverTime.length-1][1]
    }
    newState.readsOverTime.push([
//        parseInt((processTimeStamp(data.timeStamp) - newState.startTime)/1000, 10),
      parseInt((data.time - newState.startTime)/1000, 10),
      prevReadCount + data.readData.length
    ]);
    data.readData.forEach((line) => {
      /* line[0] = barcode (STR)
         line[1] = ref-panel-index (INT)
         line[2] = ref-mapped-start-pos (INT)
         line[3] = ref-mapped-end-pos (INT)
         line[4] = ref-match-frac (FLOAT) */

      const sampleIdxOfRead = oldState.barcodeToSampleIdxMap[line[0]];
      const bestRefIdx = line[1];
      if (sampleIdxOfRead === undefined) {
        /* barcode isn't mapped to a sample via the config */
        return;
      }
      readsAdded++
      oldState.refMatchPerSample[sampleIdxOfRead][bestRefIdx]++;
      oldState.readCountPerSample[sampleIdxOfRead]++;

      // start & end index, relative to genomeResolution
      const startIdx = Math.floor(line[2] / genomeResolution);
      const endIdx   = Math.ceil(line[3] / genomeResolution);
      for (let i=startIdx; i<=endIdx; i++) {
        oldState.coveragePerSample[sampleIdxOfRead][i]++
      }

      // read length distribution
      const readLengthBin = Math.floor((line[3] - line[2] + 1) / readLengthResolution);
      if (readLengthBin >= oldState.readLengthPerSample[sampleIdxOfRead].length) {
        // console.error("must extend readLengthPerSample array")
      } else {
        oldState.readLengthPerSample[sampleIdxOfRead][readLengthBin]++
      }

      /* TODO this resolution could be made a lot coreser */
      for (let i=startIdx; i<=endIdx; i++) {
        oldState.referenceMatchAcrossGenome[sampleIdxOfRead][bestRefIdx][i]++
      }

    });
  })
  newState.dataVersion++
  newState.status = `Added ${readsAdded} reads`;
  // console.log("New state (after reads in)", newState)
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
      // console.log("requestReads:", err)
      // setState({status: err});
    })
}

const initialiseArray = (n) =>
  Array.from(new Array(n), () => 0)

const createInitialState = (infoJson) => {
  // console.log("JSON from server:", infoJson)
  const state = {
    name: infoJson.name,
    annotation: {genes: infoJson.reference.genes},
    references: infoJson.referencePanel
  }
  state.samples = infoJson.samples.map((s) => s.name);
  state.barcodeToSampleIdxMap = {};
  infoJson.samples.forEach((sample, sampleIdx) => {
    sample.barcodes.forEach((barcode) => {
      state.barcodeToSampleIdxMap[barcode] = sampleIdx;
    })
  });

  /* process the amplicons (primer pairs) */
  if (infoJson.reference.amplicons) {
    state.annotation.amplicons = infoJson.reference.amplicons
      .sort((a, b) => {return a[0]<b[0] ? -1 : 1});
  }
  state.annotation.genome = {length: infoJson.reference.sequence.length};
  const genomeParts = Math.ceil(state.annotation.genome.length / genomeResolution);
  state.coveragePerSample = state.samples.map(() =>
    Array.from(new Array(genomeParts), () => 0)
  );
  state.refMatchPerSample = state.samples.map((sampleName, sampleIdx) =>
    state.references.map((refName, refIdx) => 0)
  )
  state.referenceMatchAcrossGenome = state.samples.map((sampleName, sampleIdx) =>
    state.references.map(() => Array.from(new Array(genomeParts), () => 0))
  );
  state.readCountPerSample = state.samples.map(() => 0);
  state.readLengthPerSample = state.samples.map(() => initialiseArray(parseInt(1000/readLengthResolution, 10)))
  state.dataVersion = 0;
  // console.log("initial state:", state)
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

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
    newState.versions = [...Array(state.numChannels)].map(() => 1);
  }

  /* the JSON is an array of mapping datafiles */
  json.forEach((data) => {
    newState.nTotalReads += data.readData.length;
    newState.readsOverTime.push([
      parseInt((processTimeStamp(data.timeStamp) - newState.startTime)/1000, 10),
      data.readData.length
    ]);
    /* summarise the reads per barcode */
    const readsPerBarcode = [...Array(state.numChannels)].map(() => []);
    data.readData.forEach((line) => {
      const d = processReadDataLine(line, state.referenceLabels);
      readsPerBarcode[d.channel-1].push(d);
    });
    /* add the reads per barcode to the state as a crossfilter object */
    if (!newState.readsPerChannel) { /* set up crossfilter */
      newState.readsPerChannel = readsPerBarcode.map((d) => crossfilter(d));
    } else {
      /* add to crossfilter & +1 the versions as needed */
      newState.versions = readsPerBarcode.map((reads, idx) => {
        if (reads.length) {
          newState.readsPerChannel[idx].add(reads);
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
    newState.coveragePerChannel = newState.readsPerChannel.map((r) =>
      r.dimension((d) => d.location)
        .group((d) => Math.ceil(d/1000)*1000) /* this makes a histogram with x values (bases) rounded to closest 1000 */
        .all()
    )
    newState.readLengthPerChannel = newState.readsPerChannel.map((r) =>
      r.dimension((d) => d.length)
        .group((d) => Math.ceil(d/10)*10) /* this makes a histogram with x values (bases) rounded to closest 10 */
        .all()
    )
    newState.refMatchPerChannel = newState.readsPerChannel.map((r) =>
      r.dimension((d) => d.reference)
        .group((d) => d)
        .all()
    )
  }
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

export const requestRunInfo = (state, setState) => {
  setState({status: "Querying server for data"})

  fetch(`${prefix}/requestRunInfo`)
    .then((res) => {
      if (res.status !== 200) throw new Error(res.statusText);
      return res;
    })
    .then((res) => res.json())
    .then((jsonData) => {
      console.log("setting run info to:", jsonData)
      setState({status: "Connected to server. Awaiting initial read data.", ...jsonData})
    })
    .catch((err) => {
      console.warn("requestRunInfo:", err)
      setState({status: err});
    })
}

const Datapoint = require("./datapoint").default;
const { timerStart, timerEnd } = require('./timers');
const { updateConfigWithNewBarcodes} = require("./config");

/**
 * The main store of all demuxed & mapped data
 * prototypes provide the interface for data in and data out.
 */
const Datastore = function() {
  this.datapoints = [];
  this.processedData = {};
  this.viewOptions = {
    genomeResolution: 20,
    readLengthResolution: 10,
  };
  this.barcodesSeen = new Set();
}

/**
 * Add newly demuxed data to the datastore.
 * Creates anew datapoint & modifies the processedData accordingly.
 */
Datastore.prototype.addDemuxedFastq = function(fileToDemux, barcodeDemuxCounts, timestamp) {
  const datapoint = new Datapoint(fileToDemux, barcodeDemuxCounts, timestamp);
  this.datapoints.push(datapoint);
  const datapointAddress = this.datapoints.length-1;
  this.processNewlyDemuxedDatapoint(datapoint)
  return datapointAddress;
}

/**
 * Add newly mapped data to the datastore
 * Modifies the appropriate datapoint & modifies the processedData accordingly.
 */
Datastore.prototype.addMappedFastq = function(datapointAddress, results) {
  this.datapoints[datapointAddress].addMappedFastq(results);
  this.processNewlyMappedDatapoint(this.datapoints[datapointAddress]);
}

Datastore.prototype.getBarcodesSeen = function() {
  return [...this.barcodesSeen];
}

/**
 * ammends this.processedData when a new datapoint has been created (which will
 * not yet have mapping information)
 * @param datapoint {Datapoint}
 * @param notify_client {bool} if true, then the client will be sent new data
 */
Datastore.prototype.processNewlyDemuxedDatapoint = function(datapoint, notify_client=true) {
  const barcodes = datapoint.getBarcodes();
  let newBarcodesSeen = false
  barcodes.forEach((barcode) => {
    if (!this.barcodesSeen.has(barcode)) {
      this.barcodesSeen.add(barcode);
      newBarcodesSeen=true;
    }
    const sampleName = this.getSampleName(barcode);
    if (!this.processedData[sampleName]) {
      /* initialise this.processedData for any new sample names / barcodes observed */
      this.processedData[sampleName] = this.initialiseProcessedData(this.processedData[sampleName]);
    };
    this.processedData[sampleName].demuxedCount += datapoint.getDemuxedCount(barcode);
  });
  if (notify_client) {
    global.NOTIFY_CLIENT_DATA_UPDATED()
  }
  if (newBarcodesSeen) {
    updateConfigWithNewBarcodes();
  }
};


/**
 * ammends this.processedData when a datapoint has had mapping info added
 * @param datapoint {Datapoint}
 * @param notify_client {bool} if true, then the client will be sent new data
 */
Datastore.prototype.processNewlyMappedDatapoint = function(datapoint, notify_client=true) {
  timerStart("processNewlyMappedDatapoint");
  const nGenomeSlices = Math.ceil(global.config.reference.length / this.viewOptions.genomeResolution);
  const barcodes = datapoint.getBarcodes();
  const refNameToPanelIdx = {};
  global.config.referencePanel.forEach((obj, idx) => {refNameToPanelIdx[obj.name] = idx;})

  barcodes.forEach((barcode) => {
    const sampleName = this.getSampleName(barcode);
    this.initialiseMappingComponentsOfProcessedDataIfNeeded(this.processedData[sampleName], nGenomeSlices);
    this.processedData[sampleName].mappedCount += datapoint.getMappedCount(barcode);
    datapoint.appendRefMatchCounts(barcode, this.processedData[sampleName].refMatchCounts);
    datapoint.appendReadsToCoverage(barcode, this.processedData[sampleName].coverage, this.viewOptions.genomeResolution);
    appendTemporalData(barcode, datapoint.getTimestamp(), this.processedData[sampleName].mappedCount, this.processedData[sampleName].temporalMap, this.processedData[sampleName].coverage, nGenomeSlices);
    datapoint.appendReadLengthCounts(barcode, this.processedData[sampleName].readLengthCounts, this.viewOptions.readLengthResolution);
    datapoint.appendReferenceMatchCounts(barcode, this.processedData[sampleName].refMatchCountsAcrossGenome, refNameToPanelIdx, this.viewOptions.genomeResolution);
  });
  timerEnd("processNewlyMappedDatapoint");
  if (notify_client) {
    global.NOTIFY_CLIENT_DATA_UPDATED();
  }
};


/**
 * Barcode -> sample name
 */
Datastore.prototype.getSampleName = function(barcode) {
  if (global.config.barcodeToName[barcode] && global.config.barcodeToName[barcode].name) {
    return global.config.barcodeToName[barcode].name;
   }
   return barcode;
}

/**
 * Initialise the processed data for a "new" sampleName
 */
Datastore.prototype.initialiseProcessedData = function() {
  const data = {}
  data.demuxedCount = 0;
  data.mappedCount = 0;
  data.refMatchCounts = {};
  data.coverage = [];
  data.temporalMap = {};
  data.readLengthCounts = {};
  data.refMatchCountsAcrossGenome = [];
  return data;
}

/**
 * Initialise the processed data for a "new" sampleName
 */
Datastore.prototype.initialiseMappingComponentsOfProcessedDataIfNeeded = function(data, nGenomeSlices) {
  if (data.coverage.length) return // already initialised
  data.coverage = Array.from(new Array(nGenomeSlices), () => 0);
  data.refMatchCountsAcrossGenome = global.config.referencePanel.map(() => Array.from(new Array(nGenomeSlices), () => 0));
}


/**
 * For instance, if the barcode -> sample name mapping has changed
 * or if the genome resolution has changed etc.
 */
Datastore.prototype.reprocessAllDatapoints = function() {
  console.log("reprocessAllDatapoints")
  this.processedData = {};
  this.datapoints.forEach((datapoint) => {
    this.processNewlyDemuxedDatapoint(datapoint, false);
    this.processNewlyMappedDatapoint(datapoint, false);
  })
  global.NOTIFY_CLIENT_DATA_UPDATED();
}

/**
 * Creates a summary of data (similar to `this.processedData`) to deliver to the client.
 * @returns {Array}
 *    [0] {object} Summarising each sample observed so far.
 *         properties: each `sampleName` (i.e. props of `this.processedData`)
 *         values: {object}, each with properties
 *            `demuxedCount` {int}
 *            `mappedCount` {int}
 *            `refMatches` {object} may have no keys, else keys: ref names, values: floats (percentages)
 *            `coverage` {array} may be length 0. array of coverage at positions.
 *            `maxCoverage` {int}
 *            `temporal` {Array of Obj} each obj has keys `time`, `mappedCount`, `over10x`, `over100x`, `over1000x`
 *            `readLengths` {Object} keys: `xyValues`, array of [int, int]
 *            `refMatchesAcrossGenome` {Array of Array of Array of 2 numeric}
 *            `referencePanelNames` {Array of strings} same order as `refMatchesAcrossGenome`
 *    [1] {object} summarise the overall run (i.e. all samples/barcodes combined)
 *        properties:
 *        `demuxedCount` {int}
 *        `mappedCount` {int}
 *        `temporal` {}
 */
const collectSampleDataForClient = function(processedData, viewOptions) {
  timerStart("collectSampleDataForClient");
  const summarisedData = {};
  /* for each sample in this.processedData, summarise the information */
  for (const [sampleName, sampleData] of Object.entries(processedData)) {
    summarisedData[sampleName] = {
      demuxedCount: sampleData.demuxedCount,
      mappedCount: sampleData.mappedCount,
      refMatches: summariseRefMatches(sampleData.refMatchCounts),
      coverage: sampleData.coverage,
      maxCoverage: sampleData.coverage.reduce((pv, cv) => cv > pv ? cv : pv, 0),
      temporal: summariseTemporalData(sampleData.temporalMap),
      readLengths: summariseReadLengths(sampleData.readLengthCounts, viewOptions.readLengthResolution),
      refMatchesAcrossGenome: createReferenceMatchStream(sampleData.refMatchCountsAcrossGenome, global.config.referencePanel, viewOptions.genomeResolution),
      referencePanelNames: global.config.referencePanel.map((obj) => obj.name)
    }
  }

  const combinedData = {
    demuxedCount: Object.values((processedData)).map((d) => d.demuxedCount).reduce((pv, cv) => pv+cv, 0),
    mappedCount: Object.values((processedData)).map((d) => d.mappedCount).reduce((pv, cv) => pv+cv, 0),
    temporal: summariseOverallTemporalData(summarisedData)
  }

  timerEnd("collectSampleDataForClient");
  return [summarisedData, combinedData];
}

Datastore.prototype.getDataForClient = function() {
  const [dataPerSample, combinedData] = collectSampleDataForClient(this.processedData, this.viewOptions);
  if (!Object.keys(dataPerSample).length) return false;
  return {dataPerSample, combinedData, viewOptions: this.viewOptions};
}


Datastore.prototype.collectFastqFilesAndIndicies = function({sampleName, minReadLen=0, maxReadLen=10000000}) {
  const barcodes = [];
  Object.keys(global.config.barcodeToName).forEach((key) => {
    if (key === sampleName) barcodes.push(key);
    if (global.config.barcodeToName[key].name === sampleName) barcodes.push(key);
  })

  const matches = [];

  this.datapoints.forEach((datapoint) => {
    barcodes.forEach((barcode) => {
      const result = datapoint.getFastqPositionsMatchingFilters(barcode, minReadLen, maxReadLen);
      if (result) {
        matches.push(result);
      }
    })
  })

  return matches;
}

/**
 * Convert the refMatchCounts (obj of refName -> count) to object of refName -> %
 */
const summariseRefMatches = function(refMatchCounts) {
  const refMatches = {};
  const total = Object.values(refMatchCounts).reduce((pv, cv) => cv+pv, 0);
  for (const ref of Object.keys(refMatchCounts)) {
    refMatches[ref] = refMatchCounts[ref] / total * 100;
  }
  return refMatches;
}


const summariseTemporalData = function(temporalMap) {
  return Object.values(temporalMap).sort((a, b) => a.time>b.time ? 1 : -1);
}

/**
 * Turn `readLengthCounts` into an array of xy values for visualisation
 * NOTE: due to the way we draw lines, we need padding zeros! (else the d3 curve will join up points)
 */
const summariseReadLengths = function(readLengthCounts, readLengthResolution) {
  const xValues = Object.keys(readLengthCounts).map((n) => parseInt(n, 10)).sort((a, b) => parseInt(a, 10) > parseInt(b, 10) ? 1 : -1);
  const counts = xValues.map((x) => readLengthCounts[x]);
  const readLengths = {};
  /* edge case */
  readLengths.xyValues = [
    [xValues[0]-readLengthResolution, 0],
    [xValues[0], counts[0]]
  ];
  /* for each point, pad with zero on LHS unless it's a single step ahead */
  for (let i = 1; i < xValues.length; i++) {
    const singleStepAhead = xValues[i] - readLengthResolution === xValues[i-1];
    if (!singleStepAhead) {
      readLengths.xyValues.push([xValues[i]-readLengthResolution, 0]);
    }
    readLengths.xyValues.push([xValues[i], counts[i]]);
  }
  return readLengths;
}


/**
 * Turn the reference counts (`refMatchCountsAcrossGenome`)
 * to a stream for vizualisation.
 * A stream is the data structure demanded by d3 for a stream graph.
 * it is often produced by the d3.stack function - see https://github.com/d3/d3-shape/blob/master/README.md#_stack
 * Structure:
 *  [x1, x2, ... xn] where n is the number of references
 *      xi = [y1, y2, ..., ym] where m is the number of pivots (i.e. x points)
 *            yi = [z1, z2]: the (y0, y1) values of the reference at that pivot point.
 */
const createReferenceMatchStream = function(refMatchCountsAcrossGenome, referencePanel, genomeResolution) {
  if (!refMatchCountsAcrossGenome.length) {
    return [];
  }
  const nGenomeSlices = Math.ceil(global.config.reference.length / genomeResolution);
  const stream =  referencePanel.map(() => Array.from(new Array(nGenomeSlices), () => [0,0]));
  const nReferences = referencePanel.length;

  for (let xIdx=0; xIdx<nGenomeSlices; xIdx++) {
    let totalReadsHere = 0;
    for (let refIdx=0; refIdx<nReferences; refIdx++) {
      totalReadsHere += refMatchCountsAcrossGenome[refIdx][xIdx];
    }
    let yPosition = 0;
    for (let refIdx=0; refIdx<nReferences; refIdx++) {
      /* require >10 reads to calc stream */
      const percHere = totalReadsHere > 10 ? refMatchCountsAcrossGenome[refIdx][xIdx] / totalReadsHere : 0
      stream[refIdx][xIdx] = [yPosition, yPosition+percHere];
      yPosition += +percHere;
    }
  }

  return stream;
}

/**
 * We want to create an array of `[ [time, mappedCount], ... ]` for all barcodes combined.
 * 
 * This exists for each sample, however be aware that the time entries for individual barcodes 
 * may be different e.g. BC01 may have time=42, but BC02 may not, so we must "remember" the 
 * value last seen and use this instead.
 */
const summariseOverallTemporalData = (summarisedData) => {
  /* what are the timestamps we've seen? */
  const timeCountMap = {};
  const timesSeen = new Set();
  for (const [sampleName, sampleData] of Object.entries(summarisedData)) {
    timeCountMap[sampleName] = {};
    // eslint-disable-next-line no-loop-func
    sampleData.temporal.forEach((timePoint) => {
      timesSeen.add(timePoint.time);
      timeCountMap[sampleName][String(timePoint.time)] = timePoint.mappedCount;
    });
  }

  const temporal = [...timesSeen].map((n) => parseInt(n, 10))
    .sort((a, b) => parseInt(a, 10) > parseInt(b, 10) ? 1 : -1)
    .map((time) => ({time, mappedCount: 0}));

  /* Loop over each sampleName */
  Object.keys(summarisedData).forEach((sampleName) => {
    /* Loop over `temporal` */
    let lastSeen = 0; /* the last seen mappedCount for this sampleName */
    temporal.forEach((timePoint) => {
      if (timeCountMap[sampleName]) {
        const count = timeCountMap[sampleName][String(timePoint.time)];
        timePoint.mappedCount += count;
        lastSeen = count;
      } else {
        timePoint.mappedCount += lastSeen;
      }
    });
  });
  return temporal;
}



/* adds temporal data to the temporalMap */
const appendTemporalData = function(barcode, timestamp, mappedCount, temporalMap, coverage, nGenomeSlices) {
  const temporalDataPoint = {
    time: timestamp,
    mappedCount: mappedCount,
    over10x:   parseInt((coverage.reduce((acc, cv) => cv > 10   ? ++acc : acc, 0)/nGenomeSlices)*100, 10),
    over100x:  parseInt((coverage.reduce((acc, cv) => cv > 100  ? ++acc : acc, 0)/nGenomeSlices)*100, 10),
    over1000x: parseInt((coverage.reduce((acc, cv) => cv > 1000 ? ++acc : acc, 0)/nGenomeSlices)*100, 10),
  };
  temporalMap[String(timestamp)] = temporalDataPoint; // this is ok if it overwrites
}

module.exports = { default: Datastore };

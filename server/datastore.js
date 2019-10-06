const Datapoint = require("./datapoint").default;
const { timerStart, timerEnd } = require('./timers');
const { updateConfigWithNewBarcodes, updateWhichReferencesAreDisplayed, updateReferencesSeen } = require("./config");

/**
 * The main store of all annotated data.
 * prototypes provide the interface for data in and data out.
 */
const Datastore = function() {
  this.datapoints = [];
  this.processedData = {};
  this.barcodesSeen = new Set();

  /* Given barcodes (e.g. via config files) intiialise the data structures
  This means they will be displayed in the client, even if no reads have arrived for them */
  for (const barcode of Object.keys(global.config.run.barcodeNames)) {
    this.barcodesSeen.add(barcode);
    const sampleName = this.getSampleName(barcode)
    this.processedData[sampleName] = this.initialiseProcessedData();
  }

};


/**
 * Add newly annotated data to the datastore.
 * Creates a new datapoint & modifies the processedData accordingly.
 *
 * annotations is an array of objects with the following values for each read:
 *  read_name,read_len,start_time,barcode,best_reference,ref_len,start_coords,end_coords,num_matches,aln_block_len
 */
Datastore.prototype.addAnnotations = function(fileNameStem, annotations) {

  /* step 1: create the datapoint (1 FASTQ == 1 CSV == 1 DATAPOINT) */
  const datapoint = new Datapoint(fileNameStem, annotations);
  this.datapoints.push(datapoint);

  /* step 2: update `processedData`, which is a summary of the run so far */
  const referencesSeen = new Set();
  datapoint.getBarcodes().forEach((barcode) => {
    this.barcodesSeen.add(barcode);

    const sampleName = this.getSampleName(barcode);

    /* if we're encountering a sample name for the first time, then we must create the empty data struct */
    if (!this.processedData[sampleName]) {
      /* initialise this.processedData if a new sample name has been observed */
      this.processedData[sampleName] = this.initialiseProcessedData();
    }

    this.processedData[sampleName].mappedCount += datapoint.getMappedCount(barcode);
    /* modify the refMatchCounts to include these results */
    datapoint.appendRefMatchCounts(barcode, this.processedData[sampleName].refMatchCounts, referencesSeen);
    /* modify the coverage bins (for this sample) to include these results */
    datapoint.appendReadsToCoverage(barcode, this.processedData[sampleName].coverage);

    // TODO
    // appendTemporalData(barcode, datapoint.getTimestamp(), this.processedData[sampleName].mappedCount, this.processedData[sampleName].temporalMap, this.processedData[sampleName].coverage, nGenomeSlices);

    /* update the read length counts with new data */
    datapoint.appendReadLengthCounts(barcode, this.processedData[sampleName].readLengthCounts);
    /* update per-reference-match coverage stats with new data */
    datapoint.appendRefMatchCoverages(barcode, this.processedData[sampleName].refMatchCoverages);
  });

  /* step 3: trigger server-client data updates as needed */
  updateConfigWithNewBarcodes();
  updateReferencesSeen(referencesSeen);
  global.NOTIFY_CLIENT_DATA_UPDATED()
};


/**
 * Get Barcode -> sample name via the (global) config
 */
Datastore.prototype.getSampleName = function(barcode) {
  if (global.config.run.barcodeNames[barcode] && global.config.run.barcodeNames[barcode].name) {
    return global.config.run.barcodeNames[barcode].name;
  }
  return barcode;
};

/**
 * Initialise the processed data for a "new" sampleName
 */
Datastore.prototype.initialiseProcessedData = function() {
  const data = {};
  data.mappedCount = 0;
  data.refMatchCounts = {};
  data.coverage = Array.from(new Array(global.config.display.numCoverageBins), () => 0)
  data.temporalMap = {};
  data.readLengthCounts = {};
  data.refMatchCoverages = {};
  return data;
};

/**
 * Initialise the processed data for a "new" sampleName
 */
// Datastore.prototype.initialiseMappingComponentsOfProcessedDataIfNeeded = function(data) {
//   if (data.coverage.length) {
//     return; // already initialised
//   }
//   data.coverage = Array.from(new Array(global.config.display.numCoverageBins), () => 0);
//   data.refMatchCountsAcrossGenome = global.config.referencePanel.map(() => 
//     Array.from(new Array(global.config.display.numCoverageBins), () => 0)
//   );
// };


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
  });
  global.NOTIFY_CLIENT_DATA_UPDATED();
};

Datastore.prototype.getBarcodesSeen = function() {
  return [...this.barcodesSeen];
}

/**
 * Choose which references should be displayed
 * we only want to report references over some threshold so that
 * the display is not cluttered with too many rows in the heatmap
 * TODO: make this threshold / number taken definable by the client
 * @param {object} processedData see datastore.processedData
 * @param {int} threshold at least 1 sample must have over this perc of reads mapping to include
 * @param {int} maxNum max num of references to return
 */
const whichReferencesToDisplay = (processedData, threshold=5, maxNum=10) => {
  const refMatchesAcrossSamples = {};
  const refsAboveThres = {}; /* references above ${threshold} perc in any sample. values = num samples matching this criteria */
  for (const [sampleName, sampleData] of Object.entries(processedData)) {
    /* calculate the percentage mapping for this sample across all references to compare with threshold */
    refMatchesAcrossSamples[sampleName] = {};
    const refMatchPercs = {};
    const total = Object.values(sampleData.refMatchCounts).reduce((pv, cv) => cv+pv, 0);
    for (const ref of Object.keys(sampleData.refMatchCounts)) {
      refMatchPercs[ref] = sampleData.refMatchCounts[ref] / total * 100;
      refMatchesAcrossSamples[sampleName][ref] = sampleData.refMatchCounts[ref];
    }
    refMatchesAcrossSamples[sampleName].total = total;

    for (const [refName, perc] of Object.entries(refMatchPercs)) {
      if (perc > threshold) {
        if (refsAboveThres[refName] === undefined) refsAboveThres[refName]=0;
        refsAboveThres[refName]++;
      }
    }
  }
  const refsToDisplay = Object.keys(refsAboveThres)
      .sort((a, b) => refsAboveThres[a]<refsAboveThres[b] ? 1 : -1)
      .filter( a => a !== "unmapped")
      .slice(0, maxNum);

  refsToDisplay.push("unmapped");

  updateWhichReferencesAreDisplayed(refsToDisplay);
  return refMatchesAcrossSamples;
};

/**
 * Creates a summary of data (similar to `this.processedData`) to deliver to the client.
 * @returns {Array}
 *    [0] {object} Summarising each sample observed so far.
 *         properties: each `sampleName` (i.e. props of `this.processedData`)
 *         values: {object}, each with properties
 *            `mappedCount` {int}
 *            `refMatches` {object} may have no keys, else keys: ref names, values: floats (percentages)
 *            `coverage` {array} may be length 0. array of coverage at positions.
 *            `maxCoverage` {int}
 *            `temporal` {Array of Obj} each obj has keys `time`, `mappedCount`, `over10x`, `over100x`, `over1000x`
 *            `readLengths` {Object} keys: `xyValues`, array of [int, int]
 *            `refMatchCoveragesStream` {Array of Array of Array of 2 numeric}. Order matches ??? TODO
 *    [1] {object} summarise the overall run (i.e. all samples/barcodes combined)
 *        properties:
 *        `mappedCount` {int}
 *        `temporal` {}
 */
const collectSampleDataForClient = function(processedData, viewOptions) {
  timerStart("collectSampleDataForClient");

  const refMatchesAcrossSamples = whichReferencesToDisplay(processedData);

  /* for each sample in this.processedData, summarise the information */
  const summarisedData = {};
  for (const [sampleName, sampleData] of Object.entries(processedData)) {
    summarisedData[sampleName] = {
      mappedCount: sampleData.mappedCount,
      refMatches: refMatchesAcrossSamples[sampleName],
      coverage: sampleData.coverage,
      maxCoverage: sampleData.coverage.reduce((pv, cv) => cv > pv ? cv : pv, 0),
      temporal: summariseTemporalData(sampleData.temporalMap),
      readLengths: summariseReadLengths(sampleData.readLengthCounts),
      refMatchCoveragesStream: createReferenceMatchStream(sampleData.refMatchCoverages)
    }
  }

  // console.log("refMatchesAcrossGenome", refMatchesAcrossGenome)

  const combinedData = {
    mappedCount: Object.values((processedData)).map((d) => d.mappedCount).reduce((pv, cv) => pv+cv, 0),
    temporal: summariseOverallTemporalData(summarisedData)
  };

  timerEnd("collectSampleDataForClient");
  return [summarisedData, combinedData];
};

Datastore.prototype.getDataForClient = function() {
  const [dataPerSample, combinedData] = collectSampleDataForClient(this.processedData, this.viewOptions);
  if (!Object.keys(dataPerSample).length) return false;
  return {dataPerSample, combinedData, viewOptions: this.viewOptions};
};


Datastore.prototype.collectFastqFilesAndIndices = function({sampleName, minReadLen=0, maxReadLen=10000000}) {
  const barcodes = [];
  Object.keys(global.config.run.barcodeNames).forEach((key) => {
    if (key === sampleName) barcodes.push(key);
    if (global.config.run.barcodeNames[key].name === sampleName) barcodes.push(key);
  });

  const matches = [];

  this.datapoints.forEach((datapoint) => {
    barcodes.forEach((barcode) => {
      const result = datapoint.getFastqPositionsMatchingFilters(barcode, minReadLen, maxReadLen);
      if (result) {
        matches.push(result);
      }
    })
  });

  return matches;
};


const summariseTemporalData = function(temporalMap) {
  return Object.values(temporalMap).sort((a, b) => a.time>b.time ? 1 : -1);
};

/**
 * Turn `readLengthCounts` into an array of xy values for visualisation
 * NOTE: due to the way we draw lines, we need padding zeros! (else the d3 curve will join up points)
 */
const summariseReadLengths = function(readLengthCounts) {
  const readLengthResolution = global.config.display.readLengthResolution;
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
};


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
const createReferenceMatchStream = function(refMatchCoverages) {
  if (!Object.keys(refMatchCoverages).length) {
    return [];
  }
  const nBins = global.config.display.numCoverageBins;
  const stream = global.config.genome.referencePanel.map(() => Array.from(new Array(nBins), () => [0,0]));

  for (let xIdx=0; xIdx<nBins; xIdx++) {
    const totalReadsHere = Object.values(refMatchCoverages)
        .map((coverageBins) => coverageBins[xIdx])
        .reduce((a, b) => a+b)

    let yPosition = 0;
    global.config.genome.referencePanel.forEach((refInfo, refIdx) => {
      let percHere = 0;
      /* require >10 reads to calc stream & this ref must have been seen for this sample */
      if (totalReadsHere >= 10 && refMatchCoverages[refInfo.name]) {
        percHere = refMatchCoverages[refInfo.name][xIdx] / totalReadsHere;
      }
      stream[refIdx][xIdx] = [yPosition, yPosition+percHere];
      yPosition += +percHere;
    })
  }

  return stream;
};

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
};


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
};

module.exports = { default: Datastore };

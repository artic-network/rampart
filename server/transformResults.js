

/* MAGICS - these will become part of the user definable viz config */
const magics = {
  genomeResolution: 20, /* the number of bases to bin the genome coverage into */
  readLengthResolution: 10, /* bin size for read lengths */
  consensusCoverage: 1000, /* read depth to call consensus sequence */
  okCoverage: 100
}

const _createEmptyCoverage = (nGenomeSlices) => Array.from(new Array(nGenomeSlices), () => 0)

const _addReadsToCoverage = (coverage, readPositions) => {
  for (const pos of readPositions) {
    const [a, b] = pos[0]<pos[1] ? pos : [pos[1], pos[0]];
    // get coverage indexes relative to genome resolutions
    const aIdx = Math.floor(a / magics.genomeResolution);
    const bIdx = Math.ceil(b / magics.genomeResolution);
    for (let i=aIdx; i<=bIdx && i<coverage.length; i++) {
      coverage[i]++
    }
  }
}

/* adds temporal data to the temporalMap */
const _addTemporalData = (temporalMap, mappedCount, coverage, timestamp) => {
  const temporalDataPoint = {
    time: timestamp,
    mappedCount
  };
  temporalMap[String(timestamp)] = temporalDataPoint; // this is ok if it overwrites
}

/* we have temporal info for each sample, but we need to summarise it for "all" 
 * this is a little tricky as the time entries for individual barcodes may be different
 * e.g. BC01 may have time=42, but BC02 may not, so we have to use the previous one for BC02!
 */
const _summariseTemporalData = (data) => {
  /* what are the timestamps we've seen? */
  let times = new Set()
  Object.values(data).forEach((d) => {
    Object.keys(d.tmpTemporal).forEach((t) => times.add(t));
  });
  times = [...times].sort((a, b) => parseInt(a, 10) > parseInt(b, 10) ? 1 : -1);

  const temporal = times.map((time) => ({time, mappedCount: 0}));

  Object.values(data).forEach((sampleData) => {
    let lastSeen = 0; /* the last seen count */
    times.forEach((time, idx) => {
      const key = String(time);
      if (sampleData.tmpTemporal[key]) {
        temporal[idx].mappedCount = sampleData.tmpTemporal[key].mappedCount;
        lastSeen = sampleData.tmpTemporal[key].mappedCount;
      } else {
        temporal[idx].mappedCount = lastSeen;
      }
    })
  });

  return temporal;
}


/**
 * Transform the "raw" data in global.datastore
 * into a format the client wants.
 * Over time, if this becomes too expensive we can
 * explore caches / memoisation etc
 * 
 * NOTE: properties of an individual `datapoint` -- `global.datastore[barcode] = [datapoint, datapoint, ...]`
 * Currently each `datapoint` is a FASTQ but we may change this to a time point or something
 * `timestamp`
 * `mappedCount` {int}
 * `demuxedCount` {int}
 * `refMatches` {obj} keys: reference names, values: array of floats (fraction read match)
 * `readLengths` {array of ints} list of read lengths
 * `readPositions` {array of x} list of read map positions. `x`: [pos1, pos2]. Note pos2 may be < pos1.
 * 
 * Shape of returned data (every property is required)
 * `response.data[barcodeName]` has properties:
 *    `demuxedCount` {int}
 *    `mappedCount` {int}
 *    `refMatches` {object} may have no keys, else keys: ref names, values: floats (percentages)
 *    `coverage` {array} may be length 0. array of coverage at positions.
 *    `maxCoverage` {int}
 *    `temporal` {Array of Obj} each obj has keys `time`, `mappedCount`, `over10x`, `over100x`, `over1000x`
 */
const getData = () => {
  const response = {data: {}, settings: {}}
  response.settings.genomeResolution = magics.genomeResolution;
  const mainReference = !!global.config.reference;
  let nGenomeSlices = mainReference ? Math.ceil(global.config.reference.length / magics.genomeResolution) : undefined;

  for (const [barcode, dataPoints] of Object.entries(global.datastore)) {
    const name = global.config.barcodeToName[barcode] ? global.config.barcodeToName[barcode] : barcode;
    /* name may already be in `response` if there are >1 barcodes with the same "name" */
    const sampleData = response.data[name] ? response.data[name] : {
      demuxedCount: 0,
      mappedCount: 0,
      refMatches: {},
      coverage: mainReference ? _createEmptyCoverage(nGenomeSlices) : [],
      temporal: [],
      tmpTemporal: {}, // will be removed before send
    };
    // eslint-disable-next-line no-loop-func
    dataPoints.forEach((d) => {
      sampleData.demuxedCount += d.demuxedCount;
      if (d.mappedCount) sampleData.mappedCount += d.mappedCount;
      if (d.refMatches) {
        for (const [ref, values] of Object.entries(d.refMatches)) {
          if (!sampleData.refMatches[ref]) {
            sampleData.refMatches[ref] = values.length; /* currently the number of hits, not the percentage */
          }
        }
      }
      if (mainReference && d.readPositions) {
        _addReadsToCoverage(sampleData.coverage, d.readPositions);
        _addTemporalData(sampleData.tmpTemporal, sampleData.mappedCount, sampleData.coverage, d.timestamp);
      }

    });

    response.data[name] = sampleData;
  }

  /* now that all barcodes have had each datapoint processed, run post calcs */
  for (const [, sampleData] of Object.entries(response.data)) {
    /* data.refMatches needs to be percentages, but curretnly its a list of number of hits per datapoint */
    if (sampleData.refMatches) {
      const tot = Object.values(sampleData.refMatches).reduce((pv, cv) => cv+pv, 0);
      for (const ref of Object.keys(sampleData.refMatches)) {
        sampleData.refMatches[ref] = parseInt(sampleData.refMatches[ref] / tot * 100, 10);
      }
    }

    sampleData.maxCoverage = sampleData.coverage.reduce((pv, cv) => cv > pv ? cv : pv, 0);
    sampleData.temporal = Object.values(sampleData.tmpTemporal).map((d) => d)
      .sort((a, b) => a.time>b.time ? 1 : -1);
  }

  /* now that all barcodes have had each datapoint processed, summarise into `all` */
  const all = {
    demuxedCount: 0,
    mappedCount: 0,
    coverage: [],
    maxCoverage: 0,
    refMatches: {},
    temporal: _summariseTemporalData(response.data)
  }
  for (const [, sampleData] of Object.entries(response.data)) {
    all.demuxedCount += sampleData.demuxedCount;
    all.mappedCount += sampleData.mappedCount;
    delete sampleData.tmpTemporal;
  }
  response.data.all = all;
  return response;
}

module.exports = {getData};

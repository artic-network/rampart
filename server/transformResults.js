

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

/**
 * Transform the "raw" data in global.datastore
 * into a format the client wants.
 * Over time, if this becomes too expensive we can
 * explore caches / memoisation etc
 * 
 * NOTE: properties of an individual `datapoint` -- `global.datastore[barcode] = [datapoint, datapoint, ...]`
 * Currently each `datapoint` is a FASTQ but we may change this to a time point or something
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
      coverage: mainReference ? _createEmptyCoverage(nGenomeSlices) : []
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
  }

  /* collect everything into response.all */
  const all = {
    demuxedCount: 0,
    mappedCount: 0,
    coverage: [],
    maxCoverage: 0,
    refMatches: {}
  }
  for (const [, sampleData] of Object.entries(response.data)) {
    all.demuxedCount += sampleData.demuxedCount;
    all.mappedCount += sampleData.mappedCount;
  }
  response.data.all = all;
  return response;
}

module.exports = {getData};

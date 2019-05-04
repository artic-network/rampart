

/**
 * Transform the "raw" data in global.datastore
 * into a format the client wants.
 * Over time, if this becomes too expensive we can
 * explore caches / memoisation etc
 */
const getData = () => {
  const response = {}

  for (const [barcode, dataPoints] of Object.entries(global.datastore)) {
    const name = global.config.barcodeToName[barcode] ? global.config.barcodeToName[barcode] : barcode;
    /* name may already be in `response` if there are >1 barcodes with the same "name" */
    if (!response[name]) {
      response[name] = {
        demuxedCount: 0,
        mappedCount: 0,
        refMatches: {}
      }
    }

    dataPoints.forEach((d) => {
      response[name].demuxedCount += d.demuxedCount;
      if (d.mappedCount) response[name].mappedCount += d.mappedCount;
      if (d.refMatches) {
        for (const [ref, values] of Object.entries(d.refMatches)) {
          if (!response[name].refMatches[ref]) {
            response[name].refMatches[ref] = values.length; /* currently the number of hits, not the percentage */
          }
        }
      }
    });
  }

  /* now that all barcodes have had each datapoint processed, run post calcs */
  for (const [, data] of Object.entries(response)) {
    if (data.refMatches) {
      const tot = Object.values(data.refMatches).reduce((pv, cv) => cv+pv, 0);
      for (const ref of Object.keys(data.refMatches)) {
        data.refMatches[ref] = parseInt(data.refMatches[ref] / tot * 100, 10);
      }
    }
  }

  /* collect everything into response.all */
  const all = {
    demuxedCount: 0,
    mappedCount: 0
  }
  for (const [, data] of Object.entries(response)) {
    all.demuxedCount += data.demuxedCount;
    all.mappedCount += data.mappedCount;
  }

  response.all = all;
  return response;
}

module.exports = {getData};

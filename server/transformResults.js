

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
        mappedCount: 0
      }
    }

    dataPoints.forEach((d) => {
      response[name].demuxedCount += d.demuxedCount;
      if (d.mappedCount) response[name].mappedCount += d.mappedCount;
    });
  }

  /* collect everything into response.all */
  const all = {
    demuxedCount: 0,
    mappedCount: 0
  }
  for (const [, data] of Object.entries(global.datastore)) {
    all.demuxedCount += data.demuxedCount;
    all.mappedCount += data.mappedCount;
  }

  response.all = all;
  return response;
}

module.exports = {getData};

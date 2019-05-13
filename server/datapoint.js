/**
 * A Datapoint is currently the demuxing / mapping results from a single FASTQ file.
 * It contains getter & setter prototypes.
 */
const Datapoint = function(barcodeDemuxCounts, timestamp) {
  this.data = {};
  this.timestamp = timestamp;

  for (const [bc, demuxedCount] of Object.entries(barcodeDemuxCounts)) {
    const barcode = this.getBarcodeName(bc);
    this.data[barcode] = {
      demuxedCount,
      mappedCount: 0,
      readPositions: [],
      readLengths: [],
      readTopRefHits: [],
      refMatches: {}
    };
  }
}

/**
 * When mapping is successful we want to insert the data into the datastore
 * @param {obj} results from mapper. Array of Arrays. Each array of length 5
 *    [0] {str} barcode
 *    [1] {str} best reference
 *    [2] {int} mapping start pos
 *    [3] {int} mapping end pos (note: may be "less than" [2])
 *    [4] {float} mapping match frac
 */
Datapoint.prototype.addMappedFastq = function(results) {
  results.forEach((d) => {
    const barcode = this.getBarcodeName(d[0]);
    if (!this.data[barcode]) {
      throw new Error(`Mapping barcode "${barcode}" not one of the demuxed barcodes`)
    }
    this.data[barcode].mappedCount++;
    this.data[barcode].readPositions.push([d[2], d[3]]);
    this.data[barcode].readTopRefHits.push(d[1]);
    this.data[barcode].readLengths.push(Math.abs(d[3]-d[2]));
    if (this.data[barcode].refMatches[d[1]]) {
      this.data[barcode].refMatches[d[1]].push(d[4]);
    } else {
      this.data[barcode].refMatches[d[1]] = [d[4]];
    }
  });
}

Datapoint.prototype.getBarcodeName = function(barcode) {
  if (barcode === "none") return "noBarcode";
  return barcode;
}

Datapoint.prototype.getBarcodes = function() {
  return Object.keys(this.data);
}

Datapoint.prototype.getTimestamp = function() {
  return this.timestamp;
}

Datapoint.prototype.getDemuxedCount = function(barcode) {
  return this.data[barcode].demuxedCount;
}

Datapoint.prototype.getMappedCount = function(barcode) {
  return this.data[barcode].mappedCount;
}

Datapoint.prototype.appendRefMatchCounts = function (barcode, refMatchCounts) {
  for (const [ref, values] of Object.entries(this.data[barcode].refMatches)) {
    if (!refMatchCounts[ref]) {
      refMatchCounts[ref] = 0;
    }
    refMatchCounts[ref] += values.length;
  }
}

Datapoint.prototype.appendReadsToCoverage = function (barcode, coverage, genomeResolution) {
  for (const pos of this.data[barcode].readPositions) {
    const [a, b] = pos[0]<pos[1] ? pos : [pos[1], pos[0]];
    // get coverage indexes relative to genome resolutions
    const aIdx = Math.floor(a / genomeResolution);
    const bIdx = Math.ceil(b / genomeResolution);
    for (let i=aIdx; i<=bIdx && i<coverage.length; i++) {
      coverage[i]++
    }
  }
}

Datapoint.prototype.appendReadLengthCounts = function(barcode, readLengthCounts, readLengthResolution) {
  /* store them in `tmp` as key-value pairs so we can only keep the xvalues where we have data */
  this.data[barcode].readLengths.forEach((n) => {
    const len = parseInt(n/readLengthResolution, 10) * readLengthResolution;
    if (readLengthCounts[len] === undefined) {
      readLengthCounts[len] = 0;
    }
    readLengthCounts[len]++
  })
}

Datapoint.prototype.appendReferenceMatchCounts = function(barcode, refMatchesAcrossGenome, refNameToPanelIdx, genomeResolution) {
  this.data[barcode].readPositions.forEach((pos, idx) => {
    const [a, b] = pos[0]<pos[1] ? pos : [pos[1], pos[0]];
    const refIdx = refNameToPanelIdx[this.data[barcode].readTopRefHits[idx]];
    // get coverage indexes relative to genome resolutions
    const aIdx = Math.floor(a / genomeResolution);
    const bIdx = Math.ceil(b / genomeResolution);
    for (let i=aIdx; i<=bIdx && i<refMatchesAcrossGenome[refIdx].length; i++) {
      refMatchesAcrossGenome[refIdx][i]++
    }
  })
}

module.exports = { default: Datapoint };

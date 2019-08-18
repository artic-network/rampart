/**
 * A Datapoint is currently the demuxing / mapping results from a single FASTQ file.
 * It contains getter & setter prototypes.
 */
/*
* When mapping is successful we want to insert the data into the datastore
*
* annotations is an array of objects with the following values for each read:
*  read_name,read_len,start_time,barcode,best_reference,ref_len,start_coords,end_coords,num_matches,aln_block_len
*/
const Datapoint = function(fastqName, annotations, timestamp) {
  this.data = {};
  this.timestamp = timestamp;
  this.fastqName = fastqName;

  annotations.forEach((d, index) => {

    const barcode = this.getBarcodeName(d.barcode);

    if (!this.data[barcode]) {
      this.data[barcode] = {
        barcodeCount: 0,
        mappedCount: 0,
        readPositions: [],
        readLengths: [],
        readTopRefHits: [],
        refMatches: {},
        fastqPosition: [],
      };
    }

    this.data[barcode].fastqPosition.push(index);
    this.data[barcode].barcodeCount++;
    this.data[barcode].mappedCount++;
    this.data[barcode].readPositions.push([d.start_coords, d.end_coords]);
    this.data[barcode].readTopRefHits.push(d.best_reference);
    this.data[barcode].readLengths.push(d.read_len);
    if (!this.data[barcode].refMatches[d.best_reference]) {
      this.data[barcode].refMatches[d.best_reference] = [];
    }
    const similarity = d.num_matches / d.aln_block_len;
    this.data[barcode].refMatches[d.best_reference].push(similarity);
  });
};

Datapoint.prototype.getBarcodeName = function(barcode) {
  if (barcode === "none") return "noBarcode";
  return barcode;
};

Datapoint.prototype.getBarcodes = function() {
  return Object.keys(this.data);
};

Datapoint.prototype.getTimestamp = function() {
  return this.timestamp;
};

Datapoint.prototype.getDemuxedCount = function(barcode) {
  return this.data[barcode].demuxedCount;
};

Datapoint.prototype.getMappedCount = function(barcode) {
  return this.data[barcode].mappedCount;
};

Datapoint.prototype.appendRefMatchCounts = function (barcode, refMatchCounts) {
  for (const [ref, values] of Object.entries(this.data[barcode].refMatches)) {
    if (!refMatchCounts[ref]) {
      refMatchCounts[ref] = 0;
    }
    refMatchCounts[ref] += values.length;
  }
};

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
};

Datapoint.prototype.appendReadLengthCounts = function(barcode, readLengthCounts, readLengthResolution) {
  /* store them in `tmp` as key-value pairs so we can only keep the xvalues where we have data */
  this.data[barcode].readLengths.forEach((n) => {
    const len = parseInt(n/readLengthResolution, 10) * readLengthResolution;
    if (readLengthCounts[len] === undefined) {
      readLengthCounts[len] = 0;
    }
    readLengthCounts[len]++
  })
};

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
};

Datapoint.prototype.getFastqPositionsMatchingFilters = function(barcode, minReadLen, maxReadLen) {
  const barcodeData = this.data[barcode];
  if (barcodeData) {
    const fastqPositions = [];
    for (let i=0; i<barcodeData.readLengths.length; i++) {
      // MATCH FILTERS
      if (
          barcodeData.readLengths[i] >= minReadLen &&
          barcodeData.readLengths[i] <= maxReadLen
      ) {
        fastqPositions.push(barcodeData.fastqPosition[i])
      }
    }
    return [this.fastqName, fastqPositions]
  }
  return false;
};

module.exports = { default: Datapoint };

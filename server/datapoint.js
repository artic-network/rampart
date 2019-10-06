/**
 * A Datapoint is the annotated results from a single FASTQ file.
 * It contains getter & setter prototypes.
 */
/*
* When mapping is successful we want to insert the data into the datastore
*
* annotations is an array of objects with the following values for each read:
*  read_name,read_len,start_time,barcode,best_reference,ref_len,start_coords,end_coords,num_matches,aln_block_len
*/
const Datapoint = function(fileNameStem, annotations) {
  this.data = {};
//   this.timestamp = timestamp;
  this.fastqName = fileNameStem;

  annotations.forEach((d, index) => {
    const barcode = d.barcode === "none" ? "unassigned" : d.barcode;

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

    /* where the read mapped on the reference */
    const negStrand = d.start_coords > d.end_coords;
    const readPosition = {
      startBase: negStrand ? d.end_coords : d.start_coords,
      endBase: negStrand ? d.start_coords : d.end_coords,
      strand: negStrand ? "-" : "+"
    };
    readPosition.startFrac = readPosition.startBase / d.ref_len;
    readPosition.endFrac = readPosition.endBase / d.ref_len;
    this.data[barcode].readPositions.push(readPosition);

    this.data[barcode].readTopRefHits.push(d.best_reference);
    this.data[barcode].readLengths.push(d.read_len);
    if (!this.data[barcode].refMatches[d.best_reference]) {
      this.data[barcode].refMatches[d.best_reference] = [];
    }
    const similarity = d.num_matches / d.aln_block_len;
    this.data[barcode].refMatches[d.best_reference].push(similarity);

  });
};


Datapoint.prototype.getBarcodes = function() {
  return Object.keys(this.data);
};

Datapoint.prototype.getTimestamp = function() {
  return this.timestamp;
};

Datapoint.prototype.getMappedCount = function(barcode) {
  return this.data[barcode].mappedCount;
};

Datapoint.prototype.appendRefMatchCounts = function (barcode, refMatchCounts, referencesSeen) {
  for (const [ref, values] of Object.entries(this.data[barcode].refMatches)) {
    referencesSeen.add(ref);
    if (!refMatchCounts[ref]) {
      refMatchCounts[ref] = 0;
    }
    refMatchCounts[ref] += values.length;
  }
};

const getCoverageBins = (readPos) => {
  // get coverage indexes (i.e. bin number) relative to genome positions (fractions)
  return [
    Math.floor(readPos.startFrac * global.config.display.numCoverageBins),
    Math.ceil(readPos.endFrac * global.config.display.numCoverageBins)
  ];
}

Datapoint.prototype.appendReadsToCoverage = function (barcode, coverage) {
  for (const readPos of this.data[barcode].readPositions) {
    const [aIdx, bIdx] = getCoverageBins(readPos);
    for (let i=aIdx; i<=bIdx && i<coverage.length; i++) {
      coverage[i]++
    }
  }
};

Datapoint.prototype.appendReadLengthCounts = function(barcode, readLengthCounts) {
  const readLengthResolution = global.config.display.readLengthResolution;
  this.data[barcode].readLengths.forEach((n) => {
    const len = parseInt(n/readLengthResolution, 10) * readLengthResolution;
    if (readLengthCounts[len] === undefined) {
      readLengthCounts[len] = 0;
    }
    readLengthCounts[len]++
  })
};

Datapoint.prototype.appendRefMatchCoverages = function(barcode, refMatchCoverages) {
  this.data[barcode].readPositions.forEach((readPos, idx) => {
    const [aIdx, bIdx] = getCoverageBins(readPos);
    const refName = this.data[barcode].readTopRefHits[idx];
    if (!refMatchCoverages[refName]) {
      /* unseen reference -- must initialise */
      refMatchCoverages[refName] = Array.from(new Array(global.config.display.numCoverageBins), () => 0)
    }
    for (let i=aIdx; i<=bIdx && i<refMatchCoverages[refName].length; i++) {
      refMatchCoverages[refName][i]++
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

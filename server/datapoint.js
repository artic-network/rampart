const { UNASSIGNED_LABEL } = require('./config');

/**
 * A Datapoint is the annotated results from a single annotated (CSV) file
 * which is generated from a single FASTQ file. A `Datapoint` object contains
 * various getter & setter prototypes.
 *
 * TODO: this should be modified such that a `Datapoint` object is created for
 * each individual read, rather than each FASTQ/CSV.
 *
 * @param {String} fileNameStem basename of the fastq / csv
 * @param {Array} annotations array of objects each with the following properties:
 *                            read_name,read_len,start_time,barcode,best_reference,ref_len,start_coords,
 *                            end_coords,num_matches,aln_block_len
 * @param {Integer} timestamp timestamp representing this set of reads
 */
const Datapoint = function(fileNameStem, annotations) {
    this.data = {};
    this.fastqName = fileNameStem;

    this.startTime = undefined;
    this.endTime = undefined;

    annotations.forEach((d, index) => {
        d.start_time = (new Date(d.start_time)).getTime();

        if (!this.startTime || d.start_time < this.startTime) {
            this.startTime = d.start_time;
        }
        if (!this.endTime || d.start_time > this.endTime) {
            this.endTime = d.start_time;
        }

        const barcode = d.barcode === "none" ? UNASSIGNED_LABEL : d.barcode;

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

        // coerce into integers
        d.start_coords = parseInt(d.start_coords, 10);
        d.end_coords = parseInt(d.end_coords, 10);
        d.ref_len = parseInt(d.ref_len, 10);
        d.read_len = parseInt(d.read_len, 10);
        d.num_matches = parseInt(d.num_matches, 10);
        d.aln_block_len = parseInt(d.aln_block_len, 10);

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

Datapoint.prototype.getDataForBarcode = function(barcode) {
    return this.data[barcode];
}

Datapoint.prototype.getBarcodes = function() {
    return Object.keys(this.data);
};

Datapoint.prototype.getTimestamp = function() {
    return this.startTime;
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

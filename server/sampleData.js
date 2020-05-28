/*
 * Copyright (c) 2019 ARTIC Network http://artic.network
 * https://github.com/artic-network/rampart
 *
 * This file is part of RAMPART. RAMPART is free software: you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version. RAMPART is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 * See the GNU General Public License for more details. You should have received a copy of the GNU General Public License
 * along with RAMPART. If not, see <http://www.gnu.org/licenses/>.
 *
 */

/**
 * data associated with an individual sample (one or more barcodes).
 * Initialise via `new SampleData()`.
 */
const SampleData = function() {
    this.processedCount = 0;
    this.mappedCount = 0;
    this.readsLastSeenTime = undefined;
    this.processedRate = 0;
    this.refMatchCounts = {};
    this.coverage = Array.from(new Array(global.config.display.numCoverageBins), () => 0);
    this.temporal = new Map();
    this.readLengthMappedCounts = {};
    this.readLengthCounts = {};
    this.refMatchCoverages = {};
    // this.refMatchSimilarities = {};

    // Supplementary fields
    this.mapQual = Array.from(new Array(601), () => 0);
    this.meanQual = Array.from(new Array(601), () => 0);
    this.identity = Array.from(new Array(101), () => 0);
    this.refCov = Array.from(new Array(101), () => 0);
    this.readCov = Array.from(new Array(101), () => 0);
    this.alnBlockLen = Array.from(new Array(2000), () => 0);
    this.readAln = Array.from(new Array(2000), () => 0);
    this.leftClip = Array.from(new Array(2000), () => 0);
    this.rightClip = Array.from(new Array(2000), () => 0);
};

// const getCoverageBins = (readPos) => {
//     // get coverage indexes (i.e. bin number) relative to genome positions (fractions)
//     return [
//         Math.floor(readPos.startFrac * global.config.display.numCoverageBins),
//         Math.ceil(readPos.endFrac * global.config.display.numCoverageBins)
//     ];
// };
//
//
// SampleData.prototype.updateCoverage = function(data) {
//     for (const readPos of data.readPositions) {
//         const [aIdx, bIdx] = getCoverageBins(readPos);
//         for (let i=aIdx; i<=bIdx && i<this.coverage.length; i++) {
//             this.coverage[i]++;
//         }
//     }
// };

/**
 * Modifies `bins` in place
 */
const addCoverage = function(read, bins, binCount) {
    const aIdx1 = Math.floor(read.startFrac * binCount);
    const aIdx2 = Math.ceil(read.startFrac * binCount);
    const bIdx1 = Math.floor(read.endFrac * binCount);

    if (aIdx1 === bIdx1) {
        bins[aIdx1] += (read.endFrac - read.startFrac) * binCount;
    } else {
        bins[aIdx1] += aIdx2 - (read.startFrac * binCount);
        for (let i = aIdx2; i < bIdx1; i++) {
            bins[i] += 1.0;
        }
        bins[bIdx1] += (read.endFrac * binCount) - bIdx1;
    }
};

/**
 * Modifies `this.coverage`
 */
SampleData.prototype.updateCoverage = function(reads) {
    reads.forEach((read) => {
        addCoverage(read, this.coverage, global.config.display.numCoverageBins);
    })
};


/**
 * Returns binned value
 */

const binCov = function(cov) {
    return parseInt(cov)
};

const binQual = function (qual) {
    return parseInt(qual / 0.1)
};

const binIdentity = function(identity) {
    return parseInt(identity / 0.01)
};


/**
 * Modifies `this[attrName]`
 */
SampleData.prototype.updateBinnedAttribute = function(reads, attrName, binCallback) {
    reads.forEach((read) => {
        this[attrName][binCallback(read[attrName])] += 1
    })
};

SampleData.prototype.updateValuesAttribute = function(reads, attrName) {
    reads.forEach((read) => {
        this[attrName][read[attrName]] += 1
    })
};


/**
 * Modifies `this.readLengthCounts` and `this.readLengthMappedCounts`
 */
SampleData.prototype.updateReadLengthCounts = function(reads) {
    const readLengthResolution = global.config.display.readLengthResolution;
    reads.forEach((read) => {
        const len = parseInt(read.readLength/readLengthResolution, 10) * readLengthResolution;
        /* mapped or not, add to `this.readLengthCounts` */
        if (this.readLengthCounts[len] === undefined) {
            this.readLengthCounts[len] = 0;
        }
        this.readLengthCounts[len]++;
        /* add mapped reads to `this.readLengthMappedCounts` */
        if (read.mapped) {
            if (this.readLengthMappedCounts[len] === undefined) {
                this.readLengthMappedCounts[len] = 0;
            }
            this.readLengthMappedCounts[len]++;
        }
    })
};

/**
 * Update `this.readsLastSeenTime`. Before we had one timestamp per fastq
 * The current implementation sets this to be the _latest_ read time in `reads`
 */
SampleData.prototype.updateTimestamps = function(reads) {
    if (!this.processedCount) return; // no reads yet
    reads.forEach((read) => {
        if (!this.readsLastSeenTime || read.time > this.readsLastSeenTime) {
            this.readsLastSeenTime = read.time;
        }
    })
}

/**
 * update per-reference-match coverage stats
 * modifies `this.refMatchCoverages` in place
 */
SampleData.prototype.updateRefMatchCoverages = function(reads) {
    reads.forEach((read) => {
        /* initialise unseen reference */
        if (!this.refMatchCoverages[read.topRefHit]) {
            this.refMatchCoverages[read.topRefHit] = Array.from(new Array(global.config.display.numCoverageBins), () => 0);
        }
        addCoverage(read, this.refMatchCoverages[read.topRefHit], global.config.display.numCoverageBins);
    })
};

/**
 * update per-reference-match coverage stats
 * modifies `this.refMatchSimiliarities` in place
 */
SampleData.prototype.updateRefMatchSimilarities = function(reads) {
    reads.forEach((read) => {
        /* initialise unseen reference */
        if (!this.refMatchSimilarities[read.topRefHit]) {
            this.refMatchSimilarities[read.topRefHit] = [];
        }
        if (read.topRefHitSimilarity) { // unmapped reads won't have this property
            this.refMatchSimilarities[read.topRefHit].push(read.topRefHitSimilarity);
        }
    })
};

/**
 * Updates `this.refMatchCounts`.
 * Returns set of references observed in these reads.
 */
SampleData.prototype.updateRefMatchCounts = function(reads) {
    const referencesSeen = new Set();
    reads.forEach((read) => {
        const ref =  read.topRefHit;
        referencesSeen.add(ref);
        if (!this.refMatchCounts[ref]) {
            this.refMatchCounts[ref] = 0;
        }
        this.refMatchCounts[ref]++;
    })
    return referencesSeen;
};

/**
 * Update this.mappedCount and this.processedCount
 */
SampleData.prototype.updateReadCounts = function(reads) {
    this.processedCount += reads.length;
    reads.forEach((read) => {
        if (read.mapped) this.mappedCount++;
    })
};

SampleData.prototype.coveragePercentAboveThreshold = function(threshold) {
    return (this.coverage.reduce((acc, cv) => {
        return cv > threshold ? acc + Math.min(cv, 1.0) : acc;
    }, 0.0) / this.coverage.length) * 100;
};

SampleData.prototype.updateTemporalData = function(reads) {
    /* this.temporal[t] is the state of the world at time `t` */
    /* this.temporal is a map where the insertion order is guaranteed to be chronological */

    /* currently, it only makes sense to add a new entry here if `timestamp` is newer
    than anything we've previously seen (due to the way we store data cumulatively).
    This should generally be true, but may not be true at startup if we don't sort
    the existing CSVs / FASTQs according to time. To account for this
    if we have already observed a "newer" timestamp than the one we're trying to add
    then we update the data associated with that rather than creating a new entry */

    if (!this.processedCount) return; // no reads yet

    /* Jan 8 2020 - we now have times for all `reads` but here i'm using the "first" timestamp
    of the reads to define them all. This keeps the behavior similar to the previous implementation.
    This can be improved. TODO. */
    const timestampOfThisData = reads[0].time;

    /* Update this.readsLastSeenTime */
    if (!this.readsLastSeenTime || timestampOfThisData > this.readsLastSeenTime) {
        this.readsLastSeenTime = timestampOfThisData;
    }

    const latestExistingTimestamp = Array.from(this.temporal.keys()).pop() || 0;
    const timestamp = timestampOfThisData >= latestExistingTimestamp ? timestampOfThisData : latestExistingTimestamp;
    
    const temporalData = {
        // time: timestamp,
        mappedCount: this.mappedCount,
        processedCount: this.processedCount,
        processedRate: 0,
        coverages: {}
    };

    for (const [key, value] of Object.entries(global.config.display.coverageThresholds)) {
        if (value === 0) {
            temporalData.coverages[key] = 100.0 - this.coveragePercentAboveThreshold(0);
        } else {
            temporalData.coverages[key] = this.coveragePercentAboveThreshold(value);
        }
    }
    this.temporal.set(timestamp, temporalData);
};

const TIME_WINDOW = 30; // time window for calculating the rate of read aquisition in seconds.

/**
 * @param {numeric} timestampAdjustment unix time in ms
 * @returns {Object} temporal data for the client. Time value is adjusted & converted to seconds.
 */
SampleData.prototype.summariseTemporalData = function(timestampAdjustment) {
    const ret = [];
    for (const [unadjustedTimestamp, value] of this.temporal.entries()) {
        ret.push({
            time: parseInt((unadjustedTimestamp - timestampAdjustment)/1000, 10),
            ...value
        });
    }

    for (let i = ret.length - 1; i > 0; i--) {
        for (let j = i - 1; j >= 0; j--) {
            if (ret[i].time - ret[j].time > TIME_WINDOW) {
                ret[i].processedRate = (ret[i].processedCount - ret[j].processedCount) / (ret[i].time - ret[j].time);
            }
        }
    }

    return ret;
};

/**
 * Update a `SampleData` object with a collection of new reads
 * @param {SampleData} sampleData 
 * @param {array} reads
 * @returns {obj} Keys:
 *                {set} referencesSeen
 */
const updateSampleDataWithNewReads = (sampleData, reads) => {

    sampleData.updateReadCounts(reads);

    const referencesSeen = sampleData.updateRefMatchCounts(reads);

    sampleData.updateCoverage(reads);
    
    sampleData.updateReadLengthCounts(reads);

    sampleData.updateRefMatchCoverages(reads);

    sampleData.updateTemporalData(reads);

    /* Following removed as the client no longer uses it - Mar 30 2020 */
    // sampleData.updateRefMatchSimilarities(reads);

    // Update supplemental columns
    sampleData.updateBinnedAttribute(reads, 'mapQual', binQual);

    sampleData.updateBinnedAttribute(reads, 'meanQual', binQual);

    sampleData.updateBinnedAttribute(reads, 'identity', binIdentity);

    sampleData.updateBinnedAttribute(reads, 'refCov', binCov);

    sampleData.updateBinnedAttribute(reads, 'readCov', binCov);

    sampleData.updateValuesAttribute(reads, 'alnBlockLen');

    sampleData.updateValuesAttribute(reads, 'readAln');

    sampleData.updateValuesAttribute(reads, 'leftClip');

    sampleData.updateValuesAttribute(reads, 'rightClip');

    return {referencesSeen};
}


module.exports = { SampleData, updateSampleDataWithNewReads };

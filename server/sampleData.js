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
    this.mappedCount = 0;
    this.readsLastSeenTime = undefined;
    this.mappedRate = 0;
    this.refMatchCounts = {};
    this.coverage = Array.from(new Array(global.config.display.numCoverageBins), () => 0)
    this.temporal = new Map();
    this.readLengthCounts = {};
    this.refMatchCoverages = {};
};

const getCoverageBins = (readPos) => {
    // get coverage indexes (i.e. bin number) relative to genome positions (fractions)
    return [
        Math.floor(readPos.startFrac * global.config.display.numCoverageBins),
        Math.ceil(readPos.endFrac * global.config.display.numCoverageBins)
    ];
};


SampleData.prototype.updateCoverage = function(data) {
    for (const readPos of data.readPositions) {
        const [aIdx, bIdx] = getCoverageBins(readPos);
        for (let i=aIdx; i<=bIdx && i<this.coverage.length; i++) {
            this.coverage[i]++;
        }
    }
};

SampleData.prototype.updateReadLengthCounts = function(data) {
    const readLengthResolution = global.config.display.readLengthResolution;
    data.readLengths.forEach((n) => {
        const len = parseInt(n/readLengthResolution, 10) * readLengthResolution;
        if (this.readLengthCounts[len] === undefined) {
            this.readLengthCounts[len] = 0;
        }
        this.readLengthCounts[len]++
    })
};


SampleData.prototype.updateRefMatchCoverages = function(data) {
    data.readPositions.forEach((readPos, idx) => {
        const [aIdx, bIdx] = getCoverageBins(readPos);
        const refName = data.readTopRefHits[idx];
        if (!this.refMatchCoverages[refName]) {
            /* unseen reference -- must initialise */
            this.refMatchCoverages[refName] = Array.from(new Array(global.config.display.numCoverageBins), () => 0)
        }
        for (let i=aIdx; i<=bIdx && i<this.refMatchCoverages[refName].length; i++) {
            this.refMatchCoverages[refName][i]++
        }
    })
};

SampleData.prototype.updateRefMatchCounts = function(data, referencesSeen) {
    for (const [ref, values] of Object.entries(data.refMatches)) {
        referencesSeen.add(ref);
        if (!this.refMatchCounts[ref]) {
            this.refMatchCounts[ref] = 0;
        }
        this.refMatchCounts[ref] += values.length;
    }
};

SampleData.prototype.updateMappedCount = function(mappedCount, timestamp) {
    this.mappedCount += mappedCount;
    if (mappedCount > 0) {
        this.readsLastSeenTime = timestamp;
    }
};

SampleData.prototype.coveragePercAboveThreshold = function(threshold) {
    return parseInt((this.coverage.reduce((acc, cv) => cv > threshold ? ++acc : acc, 0)/this.coverage.length)*100, 10);
};

SampleData.prototype.updateTemporalData = function(data, timestampOfThisData) {
    /* this.temporal[t] is the state of the world at time `t` */
    /* this.temporal is a map where the insertion order is guaranteed to be chronological */

    /* currently, it only makes sense to add a new entry here if `timestamp` is newer
    than anything we've previously seen (due to the way we store data cumulatively).
    This should generally be true, but may not be true at startup if we don't sort
    the existing CSVs / FASTQs according to time. To account for this
    if we have already observed a "newer" timestamp than the one we're trying to add
    then we update the data associated with that rather than creating a new entry */

    const latestExistingTimestamp = Array.from(this.temporal.keys()).pop() || 0;
    const timestamp = timestampOfThisData >= latestExistingTimestamp ? timestampOfThisData : latestExistingTimestamp;
    this.temporal.set(timestamp, {
        // time: timestamp,
        mappedCount: this.mappedCount,
        mappedRate: 0,
        over10x:   this.coveragePercAboveThreshold(10),
        over100x:  this.coveragePercAboveThreshold(100),
        over1000x: this.coveragePercAboveThreshold(1000)
    });
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
                ret[i].mappedRate = (ret[i].mappedCount - ret[j].mappedCount) / (ret[i].time - ret[j].time);
            }
        }
    }

    return ret;
};

module.exports = { default: SampleData };

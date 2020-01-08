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

const { createReadsFromAnnotation } = require("./annotationParser");
const { SampleData, updateSampleDataWithNewReads } = require("./sampleData");
const { timerStart, timerEnd } = require('./timers');
const {updateConfigWithNewBarcodes, updateWhichReferencesAreDisplayed, updateReferencesSeen } = require("./config");
const { UNMAPPED_LABEL } = require('./config');

/**
 * The main store of all annotated data.
 * Prototypes provide the interface for data in and data out.
 */
const Datastore = function() {
    this.reads = [];

    /* We store processed data per sample name & the structures are such that new reads can be
    cheaply added in */
    this.dataPerSample = {};
    this.filteredDataPerSample = {}; 

    this.barcodesSeen = new Set()
    this.timestampAdjustment = undefined;
    this.currentTimestamp = undefined;

    /* Given barcodes (e.g. via config files) intialise the data structures
      This means they will be displayed in the client, even if no reads have arrived for them */
    for (const barcode of Object.keys(global.config.run.barcodeNames)) {
        this.barcodesSeen.add(barcode);
        const sampleName = this.getSampleName(barcode);
        this.dataPerSample[sampleName] = new SampleData();
    }

    // TMP -- this should be instantiated when filters change / are set.
    // doing here as there's no UI for this yet
    // TODO
    for (const key of Object.keys(this.dataPerSample)) {
        this.filteredDataPerSample[key] = new SampleData();
    }

};

// this._RATE_SMOOTHING_WINDOW = 60000;

/**
 * this prototype should be called every time any timestamp is seen.
 * It ensures `this.timestampAdjustment` is the earliest timestamp
 */
Datastore.prototype.updateTimestamp = function(reads) {
    /* Jan 8 2020 - we now have times for all `reads` but here i'm using the "first" timestamp
    of the reads to define them all. This keeps the behavior similar to the previous implementation.
    This can be improved. TODO. */
    const timestamp = reads[0].time;
    if (!this.timestampAdjustment || this.timestampAdjustment > timestamp) {
        this.timestampAdjustment = timestamp;
    }
    this.currentTimestamp = timestamp;
};

/**
 * Add newly annotated data to the datastore.
 * Side effect 1: Adds new reads to `this.reads`
 * Side effect 2: Updates `this.dataPerSample` as needed.
 * Side effect 3: trigger server-client data updates.
 *
 * @param fileNameStem
 * @param {Array} annotations annotations is an array of objects with the following values for each read:
 *                            `read_name`,`read_len`,`start_time`,`barcode`,`best_reference`,`ref_len`,
 *                            `start_coords`,`end_coords`,`num_matches`,`aln_block_len`
 */
Datastore.prototype.addAnnotatedSetOfReads = function(fileNameStem, annotations) {

    const {reads, barcodes} = createReadsFromAnnotation(fileNameStem, annotations);

    /* store these reads */
    this.reads.push(...reads);

    /* update the run timestamps etc */
    this.updateTimestamp(reads)


    /* update `dataPerSample`, which contains the "overall" summary of the run so far,
    i.e. it represents a summary of `this.reads` given the current barcode-sample mapping.
    We do this "per barcode" */
    const referencesSeen = new Set();
    [...barcodes].forEach((barcode) => {
        /* update barcodes seen and if this means we're seeing new "samples" then initialise them */
        this.barcodesSeen.add(barcode);
        const barcodeReads = reads.filter((d) => d.barcode === barcode);
        const sampleName = this.getSampleName(barcode);

        /* update `dataPerSample`, which contains the "overall" summary of the run so far,
        i.e. it represents a summary of `this.reads` given the current barcode-sample mapping. */
        if (!this.dataPerSample[sampleName]) {
            this.dataPerSample[sampleName] = new SampleData();
        }
        const {referencesSeen: referencesSeenThisBarcode} = updateSampleDataWithNewReads(
            this.dataPerSample[sampleName],
            barcodeReads
        );
        [...referencesSeenThisBarcode].forEach((ref) => referencesSeen.add(ref));

        /* if filtering is in effect, then in addition to keeping `sampleData` up to date we want to
        update `filteredSampleData`. Note that if the filter specs change, then this gets a complete
        recompute, this is simply the way we add in new data to the currently enabled filters */
        const filters = global.config.display.filters;
        if (filters) {
            if (!this.filteredDataPerSample[sampleName]) {
                this.filteredDataPerSample[sampleName] = new SampleData();
            }
            updateSampleDataWithNewReads(
                this.filteredDataPerSample[sampleName],
                filterReads(barcodeReads, filters)
            );
        }
    })


    /* trigger server-client data updates */
    updateConfigWithNewBarcodes();
    updateReferencesSeen(referencesSeen);
    global.NOTIFY_CLIENT_DATA_UPDATED()
};


/** When the UI triggers a change in read filtering (or removes it) then this prototype can
 * modify `this.filteredDataPerSample` accordingly. Note that the client is not made aware
 * of this change via this function.
 */
Datastore.prototype.changeReadFilters = function() {
    const filters = global.config.display.filters;
    this.filteredDataPerSample = {};
    console.log("CHANGE READ FILTERS", filters)
    /* note that if filters were removed, then we leave filteredDataPerSample as an empty object */
    if (Object.keys(filters).length) {
        /* we have enabled filters or mofified them */
        for (const sampleName of Object.keys(this.dataPerSample)) {
            this.filteredDataPerSample[sampleName] = new SampleData();
            const barcodes = this.getBarcodesForSampleName(sampleName);
            const barcodeReads = this.reads.filter((read) => barcodes.has(read.barcode));
            updateSampleDataWithNewReads(
                this.filteredDataPerSample[sampleName],
                filterReads(barcodeReads, filters)
            );
        }
    }
}

/**
 * Get Barcode -> sample name via the (global) config
 */
Datastore.prototype.getSampleName = function(barcode) {
    if (global.config.run.barcodeNames[barcode] && global.config.run.barcodeNames[barcode].name) {
        return global.config.run.barcodeNames[barcode].name;
    }
    return barcode;
};

Datastore.prototype.getBarcodesForSampleName = function(sampleName) {
    return new Set(
        [...this.barcodesSeen].filter(
            (barcode) => this.getSampleName(barcode) === sampleName
        )
    );
}


Datastore.prototype.getBarcodesSeen = function() {
    return [...this.barcodesSeen];
};

/**
 * Choose which references should be displayed
 * we only want to report references over some threshold so that
 * the display is not cluttered with too many rows in the heatmap
 * TODO: make this threshold / number taken definable by the client
 * @param {object} dataPerSample see datastore.dataPerSample
 * @param {int} threshold at least 1 sample must have over this perc of reads mapping to include
 * @param {int} maxNum max num of references to return
 */
const whichReferencesToDisplay = (dataPerSample, threshold=5, maxNum=10) => {
    const refMatchesAcrossSamples = {};
    const refsAboveThres = {}; /* references above ${threshold} perc in any sample. values = num samples matching this criteria */
    for (const [sampleName, sampleData] of Object.entries(dataPerSample)) {
        /* calculate the percentage mapping for this sample across all references to compare with threshold */
        refMatchesAcrossSamples[sampleName] = {};
        const refMatchPercs = {};
        const total = Object.values(sampleData.refMatchCounts).reduce((pv, cv) => cv+pv, 0);
        for (const ref of Object.keys(sampleData.refMatchCounts)) {
            refMatchPercs[ref] = sampleData.refMatchCounts[ref] / total * 100;
            refMatchesAcrossSamples[sampleName][ref] = sampleData.refMatchCounts[ref];
        }
        refMatchesAcrossSamples[sampleName].total = total;

        for (const [refName, perc] of Object.entries(refMatchPercs)) {
            if (perc > threshold) {
                if (refsAboveThres[refName] === undefined) refsAboveThres[refName]=0;
                refsAboveThres[refName]++;
            }
        }
    }
    const refsToDisplay = Object.keys(refsAboveThres)
        .sort((a, b) => refsAboveThres[a]<refsAboveThres[b] ? 1 : -1)
        .filter( a => a !== UNMAPPED_LABEL)
        .slice(0, maxNum);

    refsToDisplay.push(UNMAPPED_LABEL);

    updateWhichReferencesAreDisplayed(refsToDisplay);
    return refMatchesAcrossSamples;
};

/**
 * Creates a summary of all data to deliver to the client.
 * @returns {{
 *   dataPerSample                            {Object}  data per sample name,
 *   dataPerSample[<SampleName>].mappedCount  {numeric}
 *   dataPerSample[<SampleName>].refMatches   {Object}  keys: ref names, values: floats (percentages)
 *   dataPerSample[<SampleName>].coverage     {Array}   coverage at positions across genome
 *   dataPerSample[<SampleName>].maxCoverage  {numeric} 
 *   dataPerSample[<SampleName>].temporal     {Array}   List of time points in chronological order
 *   dataPerSample[<SampleName>].temporal[<idx>]             {Object}   data related to a time point
 *   dataPerSample[<SampleName>].temporal[<idx>].time        {number}   (adjusted) timestamp
 *   dataPerSample[<SampleName>].temporal[<idx>].mappedCount {number}
 *   dataPerSample[<SampleName>].temporal[<idx>].over10x     {number}   % of genome over 10x coverage
 *   dataPerSample[<SampleName>].temporal[<idx>].over100x    {number}   % of genome over 100x coverage
 *   dataPerSample[<SampleName>].temporal[<idx>].over1000x   {number}   % of genome over 1000x coverage
 *   dataPerSample[<SampleName>].readLengths  {Object}
 *   dataPerSample[<SampleName>].readLengths.xyValues  {Array} 
 *   dataPerSample[<SampleName>].refMatchCoveragesStream  {Array} TODO
 *   combinedData              {Object}  summary of all data
 *   combinedData.mappedCount  {numeric}
 *   combinedData.temporal     {Array} TODO
 * }}
 */
Datastore.prototype.getDataForClient = function() {
    timerStart("getDataForClient");

    const dataToVisualise = Object.keys(global.config.display.filters).length ?
        this.filteredDataPerSample :
        this.dataPerSample;

    /* Part I - summarise each sample (i.e. each sample name, i.e. this.dataPerSample */
    const summarisedData = {};
    const refMatchesAcrossSamples = whichReferencesToDisplay(dataToVisualise, global.config.display.referenceMapCountThreshold, global.config.display.maxReferencePanelSize);
    for (const [sampleName, sampleData] of Object.entries(dataToVisualise)) {
        summarisedData[sampleName] = {
            mappedCount: sampleData.mappedCount,
            processedCount: sampleData.processedCount,
            readsLastSeen: sampleData.readsLastSeenTime > 0 ? (this.currentTimestamp - sampleData.readsLastSeenTime) / 1000 : 0,
            refMatches: refMatchesAcrossSamples[sampleName],
            coverage: sampleData.coverage,
            maxCoverage: sampleData.coverage.reduce((pv, cv) => cv > pv ? cv : pv, 0),
            temporal: sampleData.summariseTemporalData(this.timestampAdjustment),
            readLengthsMapped: summariseReadLengths(sampleData.readLengthMappedCounts),
            readLengths: summariseReadLengths(sampleData.readLengthCounts),
            refMatchCoveragesStream: createReferenceMatchStream(sampleData.refMatchCoverages)
        }
    }

    /* Part II - summarise the overall data, i.e. all samples combined */
    const combinedData = {
        processedCount: Object.values((dataToVisualise)).map((d) => d.processedCount).reduce((pv, cv) => pv+cv, 0),
        mappedCount: Object.values((dataToVisualise)).map((d) => d.mappedCount).reduce((pv, cv) => pv+cv, 0),
        readsLastSeen: Math.min(...Object.values(summarisedData).map((d) => d.readsLastSeen)),
        temporal: summariseOverallTemporalData(summarisedData)
    };
    combinedData.mappedRate = (combinedData.temporal.length > 0 ? combinedData.temporal[combinedData.temporal.length - 1].mappedRate : -1);

    timerEnd("getDataForClient");

    if (!Object.keys(this.dataPerSample).length) {
        return false;
    }
    return {dataPerSample: summarisedData, combinedData};
};


Datastore.prototype.collectFastqFilesAndIndices = function({sampleName, minReadLen=0, maxReadLen=10000000}) {
    console.log("This functionality is being removed & will be replaced with a better interface")
    process.exit(2)
    // const barcodes = [];
    // Object.keys(global.config.run.barcodeNames).forEach((key) => {
    //     if (key === sampleName) barcodes.push(key);
    //     if (global.config.run.barcodeNames[key].name === sampleName) barcodes.push(key);
    // });

    // const matches = [];

    // this.reads.forEach((read) => {
    //     barcodes.forEach((barcode) => {
    //         const result = datapoint.getFastqPositionsMatchingFilters(barcode, minReadLen, maxReadLen);
    //         if (result) {
    //             matches.push(result);
    //         }
    //     })
    // });

    // return matches;
};


/**
 * Turn `readLengthCounts` into an array of xy values for visualisation
 * NOTE: due to the way we draw lines, we need padding zeros! (else the d3 curve will join up points)
 */
const summariseReadLengths = function(readLengthCounts) {
    const readLengthResolution = global.config.display.readLengthResolution;
    const xValues = Object.keys(readLengthCounts).map((n) => parseInt(n, 10)).sort((a, b) => parseInt(a, 10) > parseInt(b, 10) ? 1 : -1);
    const counts = xValues.map((x) => readLengthCounts[x]);
    const readLengths = {};
    /* edge case */
    readLengths.xyValues = [
        [xValues[0]-readLengthResolution, 0],
        [xValues[0], counts[0]]
    ];
    /* for each point, pad with zero on LHS unless it's a single step ahead */
    for (let i = 1; i < xValues.length; i++) {
        const singleStepAhead = xValues[i] - readLengthResolution === xValues[i-1];
        if (!singleStepAhead) {
            readLengths.xyValues.push([xValues[i]-readLengthResolution, 0]);
        }
        readLengths.xyValues.push([xValues[i], counts[i]]);
    }
    return readLengths;
};


/**
 * Turn the reference counts (`refMatchCountsAcrossGenome`)
 * to a stream for vizualisation.
 * A stream is the data structure demanded by d3 for a stream graph.
 * it is often produced by the d3.stack function - see https://github.com/d3/d3-shape/blob/master/README.md#_stack
 * Structure:
 *  [x1, x2, ... xn] where n is the number of references
 *      xi = [y1, y2, ..., ym] where m is the number of pivots (i.e. x points)
 *            yi = [z1, z2]: the (y0, y1) values of the reference at that pivot point.
 */
const createReferenceMatchStream = function(refMatchCoverages) {
    if (!Object.keys(refMatchCoverages).length) {
        return [];
    }
    const nBins = global.config.display.numCoverageBins;
    const stream = global.config.genome.referencePanel.map(() => Array.from(new Array(nBins), () => [0,0]));

    for (let xIdx=0; xIdx<nBins; xIdx++) {
        const totalReadsHere = Object.values(refMatchCoverages)
            .map((coverageBins) => coverageBins[xIdx])
            .reduce((a, b) => a+b);

        let yPosition = 0;
        global.config.genome.referencePanel.forEach((refInfo, refIdx) => {
            let percHere = 0;
            /* require >10 reads to calc stream & this ref must have been seen for this sample */
            if (totalReadsHere >= 10 && refMatchCoverages[refInfo.name]) {
                percHere = refMatchCoverages[refInfo.name][xIdx] / totalReadsHere;
            }
            stream[refIdx][xIdx] = [yPosition, yPosition+percHere];
            yPosition += +percHere;
        })
    }

    return stream;
};

/**
 * Given temporal data for each individual sample, we want to summarise this for the overall dataset.
 *
 * NOTE: be aware that the time entries for individual samples may not line up
 * e.g. BC01 may have time=42, but BC02 may not, so we must "remember" the
 * value last seen (for BC02) and ensure this is counted for time=42.
 */
const summariseOverallTemporalData = (summarisedData) => {

    /* set of all timestamps observed */
    const timesSeen = new Set();
    Object.values(summarisedData).forEach((v) => {
        v.temporal.forEach((d) => {
            timesSeen.add(d.time);
        })
    });

    /* return structure -- chronological list of {time -> INT, mappedCount -> INT} */
    const ret = [...timesSeen]
        .sort((a, b) => a - b) // numerical sort
        .map((time) => ({time, mappedCount: 0}));

    /* loop over each sample modifing `ret` as we go */
    Object.values(summarisedData).forEach((v) => {
        const timeToCountMap = new Map(v.temporal.map((t) => [t.time, t.mappedCount]));
        let memory = 0;
        ret.forEach((timepoint) => {
            if (timeToCountMap.has(timepoint.time)) {
                memory = timeToCountMap.get(timepoint.time);
            }
            timepoint.mappedCount += memory;
        })
    });

    const TIME_WINDOW = 30; // time window for calculating the rate of read aquisition in seconds.

    // this is a pretty ugly bit of code. Probably a better way of doing with map/reduce
    for (let i = ret.length - 1; i > 0; i--) {
        for (let j = i - 1; j >= 0; j--) {
            if (ret[i].time - ret[j].time > TIME_WINDOW) {
                ret[i].mappedRate = (ret[i].mappedCount - ret[j].mappedCount) / (ret[i].time - ret[j].time);
            }
        }
    }

    return ret;
};


function filterReads(reads, filters) {
    return reads.filter((read) => {
        if (filters.maxReadLength && read.readLength > filters.maxReadLength) return false;
        if (filters.minReadLength && read.readLength < filters.minReadLength) return false;
        return true;
    });
}

module.exports = { default: Datastore };

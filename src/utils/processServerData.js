import { genomeResolution, readLengthResolution } from "../magics";
import { createSampleColours, createReferenceColours } from "./colours";
import { min } from "d3-array";

const initialiseArray = (n) =>
    Array.from(new Array(n), () => 0)


/* Add "n reads" to the "readsOverTime" array.
 * This isn't a simple push as guppy may occassionally save fastq files out-of-order
 * We do assume that a single guppy file is a "point-in-time", however this is an assumption
 * If reads aren't simply pushed (i.e. they're inserted) then we change the totals for all times "after" this insertion
 */
const modifyReadsOverTime = (readsOverTime, dataTime, newReads) => {

    if (!readsOverTime.length) {
        readsOverTime.push([0, 0]);
        readsOverTime.push([dataTime, newReads]);
        return;
    }

    let i; /* insertion point */
    for (i = readsOverTime.length-1; i>=0; i--) {
        if (readsOverTime[i][0] < dataTime) {
            break;
        }
    }
    i++;
    const readSumPreInsert = i===0 ? 0 : readsOverTime[i-1][1];
    readsOverTime.splice(i, 0, [dataTime, readSumPreInsert+newReads]);
    for (let ii = i+1; ii<readsOverTime.length; ii++) {
        readsOverTime[ii][1] += newReads;
    }
}

export const createInitialState = (infoJson) => {
    // console.log("JSON from server:", infoJson)
    const state = {
        name: infoJson.name,
        annotation: {genes: infoJson.reference.genes},
        references: infoJson.referencePanel
    }
    state.samples = infoJson.samples.map((s) => s.name);
    state.barcodeToSampleIdxMap = {};
    infoJson.samples.forEach((sample, sampleIdx) => {
        sample.barcodes.forEach((barcode) => {
            state.barcodeToSampleIdxMap[barcode] = sampleIdx;
        })
    });

    /* process the amplicons (primer pairs) */
    if (infoJson.reference.amplicons) {
        state.annotation.amplicons = infoJson.reference.amplicons
            .sort((a, b) => {return a[0]<b[0] ? -1 : 1});
    }
    state.annotation.genome = {length: infoJson.reference.sequence.length};
    state.nGenomeSlices = Math.ceil(state.annotation.genome.length / genomeResolution);
    state.coveragePerSample = state.samples.map(() =>
        Array.from(new Array(state.nGenomeSlices), () => 0)
    );
    state.refMatchPerSample = state.samples.map((sampleName, sampleIdx) =>
        state.references.map((refName, refIdx) => 0)
    )
    state.referenceMatchAcrossGenome = state.samples.map((sampleName, sampleIdx) =>
        state.references.map(() => Array.from(new Array(state.nGenomeSlices), () => 0))
    );
    state.readCountPerSample = state.samples.map(() => 0);
    state.readLengthPerSample = state.samples.map(() => initialiseArray(parseInt(1000/readLengthResolution, 10)))
    state.dataVersion = 0;

    state.coverageOverTime = state.samples.map(() => [[0, 0, 0, 0]]);
    // console.log("initial state:", state)

    // keep the colours consistent irrespective of how many channels there are (only work if there are a maximimum of 13)
    // 13 gives 12 barcodes and 1 unclassified channel?
    // TODO: Updating this for the 24 native barcodes but this needs to be dynamic.
    state.sampleColours = createSampleColours(25);
    // state.sampleColours = createSampleColours(state.samples.length);
    state.referenceColours = createReferenceColours(state.references.length);
    state.timeLastReadsReceived = undefined;

    state.readsOverTime = [];
    state.versions = [...Array(state.samples.length)].map(() => 1);
    state.nFastqs = 0;

    return state;
}

export const addNewReadsToState = (oldState, json) => {
    /* the JSON is an array of mapping results, each one consisting of
    the reads from a single guppy-basecalled FASTQ file  */

    const newState = {...oldState};

    let readsAdded = 0;
    json.forEach((data) => {
        // console.log("DATA FROM SERVER:", data);
        newState.nFastqs++;
        modifyReadsOverTime(newState.readsOverTime, data.time, data.readData.length);
        data.readData.forEach((line) => {
            /* line[0] = barcode (STR)
               line[1] = ref-panel-index (INT)
               line[2] = ref-mapped-start-pos (INT)
               line[3] = ref-mapped-end-pos (INT)
               line[4] = ref-match-frac (FLOAT) */

            const sampleIdxOfRead = oldState.barcodeToSampleIdxMap[line[0]];
            const bestRefIdx = line[1];
            if (sampleIdxOfRead === undefined) {
                /* barcode isn't mapped to a sample via the config */
                return;
            }
            readsAdded++
            oldState.refMatchPerSample[sampleIdxOfRead][bestRefIdx]++;
            oldState.readCountPerSample[sampleIdxOfRead]++;

            // start & end index, relative to genomeResolution
            const startIdx = Math.floor(line[2] / genomeResolution);
            let endIdx   = Math.ceil(line[3] / genomeResolution);
            if (endIdx >= oldState.coveragePerSample[sampleIdxOfRead].length) {
                endIdx = oldState.coveragePerSample[sampleIdxOfRead].length-1
            }
            for (let i=startIdx; i<=endIdx; i++) {
                oldState.coveragePerSample[sampleIdxOfRead][i]++
            }

            // read length distribution
            const readLengthBin = Math.floor((line[3] - line[2] + 1) / readLengthResolution);
            if (readLengthBin >= oldState.readLengthPerSample[sampleIdxOfRead].length) {
                for (let i=oldState.readLengthPerSample[sampleIdxOfRead].length; i<=readLengthBin; i++) {
                    oldState.readLengthPerSample[sampleIdxOfRead][i] = 0;
                }
            }
            oldState.readLengthPerSample[sampleIdxOfRead][readLengthBin]++

            /* TODO this resolution could be made a lot coreser */
            for (let i=startIdx; i<=endIdx; i++) {
                oldState.referenceMatchAcrossGenome[sampleIdxOfRead][bestRefIdx][i]++
            }

        });
    })

    /* For each genome, what perc is >100x coverage (e.g.) */
    const latestTime = newState.readsOverTime[newState.readsOverTime.length-1][0];
    oldState.coverageOverTime.forEach((sampleCoverageArray, sampleIdx) => {
        const cov = oldState.coveragePerSample[sampleIdx];
        sampleCoverageArray.push([ /* struct: [time, % genome over 1000x, over 100x, over 10x] */
            latestTime,
            parseInt((cov.reduce((acc, cv) => cv > 1000 ? ++acc : acc, 0)/oldState.nGenomeSlices)*100, 10),
            parseInt((cov.reduce((acc, cv) => cv > 100  ? ++acc : acc, 0)/oldState.nGenomeSlices)*100, 10),
            parseInt((cov.reduce((acc, cv) => cv > 10   ? ++acc : acc, 0)/oldState.nGenomeSlices)*100, 10)
        ]);
    })

    newState.timeLastReadsReceived = new Date();
    newState.dataVersion++
    newState.status = `Added ${readsAdded} reads`;
    // console.log("New state (after reads in)", newState)
    return newState;
}

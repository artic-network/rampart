import { genomeResolution, readLengthResolution } from "../magics";
import { createSampleColours, createReferenceColours } from "./colours";

const initialiseArray = (n) =>
    Array.from(new Array(n), () => 0)

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
    state.sampleColours = createSampleColours(13);
    // state.sampleColours = createSampleColours(state.samples.length);
    state.referenceColours = createReferenceColours(state.references.length);
    state.timeLastReadsReceived = undefined;

    return state;
}

export const addNewReadsToState = (oldState, json) => {
    /* Potentially move some of this to the server... */
    const newState = {...oldState};

    /* if we haven't yet had any reads, we have to initialise the "run start time" via the first JSON */
    if (!newState.startTime) {
//  newState.startTime = processTimeStamp(json[0].timeStamp);
        newState.startTime = json[0].time;
        newState.readsOverTime = [];
        newState.versions = [...Array(oldState.samples.length)].map(() => 1);
    }

    /* the JSON is an array of mapping results, each one consisting of
    the reads from a single guppy-basecalled FASTQ file  */
    let readsAdded = 0;
    json.forEach((data) => {
        // console.log("DATA FROM SERVER:", data)
        let prevReadCount = 0;
        if (newState.readsOverTime.length) {
            prevReadCount = newState.readsOverTime[newState.readsOverTime.length-1][1]
        }
        newState.readsOverTime.push([
//        parseInt((processTimeStamp(data.timeStamp) - newState.startTime)/1000, 10),
            parseInt((data.time - newState.startTime)/1000, 10),
            prevReadCount + data.readData.length
        ]);
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
            const endIdx   = Math.ceil(line[3] / genomeResolution);
            for (let i=startIdx; i<=endIdx; i++) {
                oldState.coveragePerSample[sampleIdxOfRead][i]++
            }

            // read length distribution
            const readLengthBin = Math.floor((line[3] - line[2] + 1) / readLengthResolution);
            if (readLengthBin >= oldState.readLengthPerSample[sampleIdxOfRead].length) {
                // console.error("must extend readLengthPerSample array")
            } else {
                oldState.readLengthPerSample[sampleIdxOfRead][readLengthBin]++
            }

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

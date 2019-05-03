const fs = require('fs')
const path = require('path')
const { promisify } = require('util');
const { save_coordinate_reference_as_fasta } = require("./mapper");
const readdir = promisify(fs.readdir);
const chalk = require('chalk');
const { setReadTime, getTimeViaSequencingSummary } = require('./extractReadTime');
const { prettyPath } = require('./utils');

const getFastqsFromDirectory = async (dir) => {
    let fastqs = (await readdir(dir))
        .filter((j) => j.endsWith(".fastq"))
        .sort((a, b) => parseInt(a.match(/\d+/), 10) > parseInt(b.match(/\d+/), 10) ? 1 : -1)
        .map((j) => path.join(dir, j));
    return fastqs;
}

const log = (msg) => console.log(chalk.yellowBright.bold(msg));

const startUp = async () => {
    log`\nRAMPART start up - Scanning input folders...`;
    /* the python mapping script needs a FASTA of the main reference (we have this inside the config JSON) */
    save_coordinate_reference_as_fasta(global.config.reference.sequence);

    let unsortedBasecalledFastqs = [];
    let unsortedDemuxedFastqs = [];

    /* Scan the basecalled FASTQ folder */
    if (global.args.startWithDemuxedReads) {
        log(`\tSkipping basecalled files due to --startWithDemuxedReads flag.`);
    } else if (fs.existsSync(global.config.basecalledPath)) {
        unsortedBasecalledFastqs = await getFastqsFromDirectory(global.config.basecalledPath);
        log(`\tFound ${unsortedBasecalledFastqs.length} basecalled fastqs in ${prettyPath(global.config.basecalledPath)}`);
    } else {
        log(`\tBasecalled directory ${prettyPath(global.config.basecalledPath)} doesn't yet eist (will watch)`);
    }

    /* Look at the demuxed folder */
    if (global.args.emptyDemuxed) {
        log(`\tClearing the demuxed folder (${prettyPath(global.config.demuxedPath)})`);
        const demuxedFilesToDelete = await readdir(global.config.demuxedPath);
        for (const file of demuxedFilesToDelete) {
            fs.unlinkSync(path.join(global.config.demuxedPath, file));
        }
    } else {
        unsortedDemuxedFastqs = await getFastqsFromDirectory(global.config.demuxedPath);
        log(`\tFound ${unsortedDemuxedFastqs.length} basecalled fastqs in ${prettyPath(global.config.demuxedPath)}`);
    }

    /* set timestamps for everything... */
    log(`\tGetting read times from basecalled and demuxed files`);
    let epochOffset = 1E100;
    for (let fastq of unsortedBasecalledFastqs) {
        await setReadTime(fastq);
    }
    for (let fastq of unsortedDemuxedFastqs) {
        await setReadTime(fastq);
    }
    /* work out minimum epoch time to set the offset appropriately */
    if (global.epochMap.size) {
        global.epochMap.forEach((tRaw, key) => {
            if (tRaw < epochOffset) epochOffset = tRaw;
        });
    }
    /* what's the minimum offset time from the summary stats, if they exist? */
    if (global.timeMap.size) {
        let minT = 1E100;
        let minKey;
        global.timeMap.forEach((t, key) => {
            if (t < minT) minKey = key;
        });
        const epochTime = await getTimeViaSequencingSummary(path.join(global.config.basecalledPath, minKey));
        if (epochTime < epochOffset) {
            epochOffset = epochTime;
        }
    }
    // console.log("epochOffset", epochOffset);
    global.epochMap.forEach((tRaw, key) => {
        global.timeMap.set(key, parseInt((tRaw - epochOffset)/1000, 10));
    });
    // console.log("AA", global.timeMap);
    // console.log("AAA", global.epochMap);
    global.epochMap.clear();
    global.epochMap.set("offset", epochOffset);

    
    /* sort the fastqs via these timestamps and push onto the appropriate deques */
    log(`\tSorting available basecalled and demuxed files based on read times`);
    unsortedDemuxedFastqs
        .sort((a, b) => global.timeMap.get(path.basename(a))>global.timeMap.get(path.basename(b)) ? 1 : -1)
        .forEach((f) => {
            global.mappingQueue.push(f);
            global.haveBeenSeen.add(path.basename(f));
        })

    const demuxedBasenames = unsortedDemuxedFastqs.map((name) => path.basename(name))
    unsortedBasecalledFastqs
        .filter((fastqPath) => !demuxedBasenames.includes(path.basename(fastqPath)))
        .sort((a, b) => global.timeMap.get(path.basename(a))>global.timeMap.get(path.basename(b)) ? 1 : -1)
        .forEach((f) => {
            global.demuxQueue.push(f);
            global.haveBeenSeen.add(path.basename(f))
        });

    log`RAMPART start up FINISHED\n`;
    // console.log(global.demuxQueue)
    // console.log(global.mappingQueue)
}


module.exports = {startUp}

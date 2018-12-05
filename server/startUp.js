const fs = require('fs')
const path = require('path')
const { promisify } = require('util');
const { save_coordinate_reference_as_fasta } = require("./mapper");
const readdir = promisify(fs.readdir);
const chalk = require('chalk');
const { setReadTime, getTimeViaSequencingSummary } = require('./extractReadTime');

const getFastqsFromDirectory = async (dir) => {
    let fastqs = (await readdir(dir))
        .filter((j) => j.endsWith(".fastq"))
        .sort((a, b) => parseInt(a.match(/\d+/), 10) > parseInt(b.match(/\d+/), 10) ? 1 : -1)
        .map((j) => path.join(dir, j));
    return fastqs;
}

const twoDeepDir = (absPath) => absPath.split("/").slice(-2).join("/");

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
        log(`\tScanning .../${twoDeepDir(global.config.basecalledPath)} for basecalled FASTQ files.`); //  Ignoring ${global.mappingQueue.length} pre-demuxed files.
        unsortedBasecalledFastqs = await getFastqsFromDirectory(global.config.basecalledPath);
    } else {
        log`\tBasecalled directory .../${twoDeepDir(global.config.basecalledPath)} doesn't yet eist (will watch)`;
    }

    /* Look at the demuxed folder */
    if (global.args.emptyDemuxed) {
        log`\tClearing the demuxed folder (${twoDeepDir(global.config.demuxedPath)})`;
        const demuxedFilesToDelete = await readdir(global.config.demuxedPath);
        for (const file of demuxedFilesToDelete) {
            fs.unlinkSync(path.join(global.config.demuxedPath, file));
        }
    } else {
        log`\tScanning .../${twoDeepDir(global.config.demuxedPath)} for demuxed FASTQ files`;
        unsortedDemuxedFastqs = await getFastqsFromDirectory(global.config.demuxedPath);
    }

    /* set timestamps for everything... */
    log`\tGetting timestamps from basecalled and demuxed files`;
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
    console.log("epochOffset", epochOffset);
    global.epochMap.forEach((tRaw, key) => {
        global.timeMap.set(key, parseInt((tRaw - epochOffset)/1000, 10));
    });
    global.epochMap.clear();
    global.epochMap.set("offset", epochOffset);
    console.log("AA", global.timeMap);
    console.log("AAA", global.epochMap);
    
    /* sort the fastqs via these timestamps and push onto the appropriate deques */
    unsortedDemuxedFastqs
        .sort((a, b) => global.timeMap.get(path.basename(a))>global.timeMap.get(path.basename(b)) ? 1 : -1)
        .forEach((f) => {
            global.mappingQueue.push(f);
            global.haveBeenSeen.add(path.basename(f));
        })

    unsortedBasecalledFastqs
        .filter((fastqPath) => !unsortedDemuxedFastqs.includes(path.basename(fastqPath)))
        .sort((a, b) => global.timeMap.get(path.basename(a))>global.timeMap.get(path.basename(b)) ? 1 : -1)
        .forEach((f) => {
            global.demuxQueue.push(f);
            global.haveBeenSeen.add(path.basename(f))
        });

    log`RAMPART start up FINISHED\n`;

}


module.exports = {startUp}

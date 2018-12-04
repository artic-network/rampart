const fs = require('fs')
const path = require('path')
const { promisify } = require('util');
const { save_coordinate_reference_as_fasta } = require("./mapper");
const readdir = promisify(fs.readdir);
const { spawn } = require('child_process');
const chalk = require('chalk');
const chokidar = require('chokidar');


const getFastqTimestamp = (filepath) => new Promise((resolve, reject) => {
    const head = spawn('head', ['-n', '1', filepath]);
    head.stdout.on('data', (data) => {
        // console.log(filepath, data.toString(), (new Date((/start_time=(\S+)/g).exec(data)[1])).getTime())
        resolve((new Date((/start_time=(\S+)/g).exec(data.toString())[1])).getTime());
    });
});

const sortFastqsChronologically = async (fastqsUnsorted) => {
    const timeMap = new Map();
    for (let i=0; i<fastqsUnsorted.length; i++) {
        try {
            const timestamp = await getFastqTimestamp(fastqsUnsorted[i]);
            timeMap.set(fastqsUnsorted[i], timestamp);
        } catch (err) {
            // no-op. There won't be a timestamp in timeMap and the fastq will be ignored
        }
    }
    const chronologicalFastqs = fastqsUnsorted.filter((f) => timeMap.has(f))
        .sort((a, b) => timeMap.get(a)>timeMap.get(b) ? 1 : -1);
    return chronologicalFastqs;
}

const getFastqsFromDirectory = async (dir, {sortByTime=true, exclude=undefined} = {}) => {
    let fastqs = (await readdir(dir))
        .filter((j) => j.endsWith(".fastq"))
        .sort((a, b) => parseInt(a.match(/\d+/), 10) > parseInt(b.match(/\d+/), 10) ? 1 : -1)
        .map((j) => path.join(dir, j));
    
    if (exclude) {
        const excludeList = exclude.map((p) => path.basename(p));
        fastqs = fastqs.filter((fastqPath) => !excludeList.includes(path.basename(fastqPath)))
    }

    /* examining the time stamps can be slow */
    if (global.args.subsetFastqs) {
        console.log(chalk.yellowBright.bold("\t\tOnly considering 100 FASTQs for speed reasons."))
        fastqs = fastqs.slice(0, 100);
    }

    console.log(chalk.yellowBright.bold(`\t\tFound ${fastqs.length} FASTQ files.`));

    if (sortByTime) {
        process.stdout.write(chalk.yellowBright.bold(`\t\tSorting by timestamp... `)); /* no newline */
        fastqs = await sortFastqsChronologically(fastqs);
        console.log(chalk.yellowBright.bold(`SORTED.`))
    }

    return fastqs;
}

const startWatcher = (directory, addFunction) => {

    // Initialize watcher.
    var watcher = chokidar.watch(directory, {
        ignored: /(^|[\/\\])\../,
        persistent: true
    });

    watcher
        .on('raw', (event, path, details) => {
            addFunction(path, event);
        });
}

const twoDeepDir = (absPath) => absPath.split("/").slice(-2).join("/");

const startUp = async () => {
    console.log(chalk.yellowBright.bold("\nRAMPART start up - Scanning input folders..."));
    /* the python mapping script needs a FASTA of the main reference (we have this inside the config JSON) */
    save_coordinate_reference_as_fasta(global.config.reference.sequence);


    /* Scan the demuxed FASTQ folder */
    if (global.args.emptyDemuxed) {
        console.log(chalk.yellowBright.bold(`\tClearing the demuxed folder (${twoDeepDir(global.config.demuxedPath)})`))
        const demuxedFilesToDelete = await readdir(global.config.demuxedPath);
        for (const file of demuxedFilesToDelete) {
            fs.unlinkSync(path.join(global.config.demuxedPath, file));
        }
    } 
    console.log(chalk.yellowBright.bold(`\tScanning .../${twoDeepDir(global.config.demuxedPath)} for demuxed FASTQ files`));
    let filesToMap = await getFastqsFromDirectory(global.config.demuxedPath, {sortByTime: true});
    filesToMap.forEach((f) => global.mappingQueue.push(f));


    /* Scan the basecalled FASTQ folder */
    if (global.args.startWithDemuxedReads) {
        console.log(chalk.yellowBright.bold(`\tSkipping basecalled files due to --startWithDemuxedReads flag.`));
    } else {
        console.log(chalk.yellowBright.bold(`\tScanning .../${twoDeepDir(global.config.basecalledPath)} for basecalled FASTQ files. Ignoring ${global.mappingQueue.length} pre-demuxed files.`));
         const basecalledFiles = await getFastqsFromDirectory(global.config.basecalledPath, {sortByTime: true, exclude: global.mappingQueue});
         basecalledFiles.forEach((f) => global.demuxQueue.push(f));
    }

    if (!global.args.startWithDemuxedReads) {
        console.log(chalk.yellowBright(`\tStarted watching folder ${global.config.basecalledPath}`));
        console.log(chalk.yellowBright(`\t(basecalled files created here will be demuxed)`));
        startWatcher(global.config.basecalledPath, ( path, event ) => {
            console.log(chalk.green(`DAEMON: File ${path} has event ${event}`));
            global.demuxQueue.push(path);
        });
    }

    console.log(chalk.yellowBright(`\tStarted watching folder ${global.config.demuxedPath}`));
    console.log(chalk.yellowBright(`\t(demuxed files created here will be processed)`));
    startWatcher(global.config.demuxedPath, (path, event) => {
        console.log(chalk.green(`DAEMON: File ${path} has event ${event}`));
        global.mappingQueue.push(path);
    });



    console.log(chalk.yellowBright.bold("RAMPART start up FINISHED\n"));

}


module.exports = {startUp}

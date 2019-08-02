const fs = require('fs')
const path = require('path')
const { promisify } = require('util');
const { addToParsingQueue } = require("./annotationParser");
const { addToAnnotationQueue } = require("./annotator");
const readdir = promisify(fs.readdir);
const { setReadTime, getReadTime, setEpochOffset } = require('./readTimes');
const { prettyPath, verbose, log, deleteFolderRecursive } = require('./utils');

const getFastqsFromDirectory = async (dir) => {
    let fastqs = (await readdir(dir))
        .filter((j) => j.endsWith(".fastq"))
        .sort((a, b) => parseInt(a.match(/\d+/), 10) > parseInt(b.match(/\d+/), 10) ? 1 : -1)
        .map((j) => path.join(dir, j));
    return fastqs;
}

const startUp = async ({clearAnnotated=false}={}) => {

  log("Rampart Start Up")
  if (!fs.existsSync(global.config.basecalledPath) || !fs.existsSync(global.config.annotatedPath)) {
    verbose("[startUp] no basecalled dir / annotated dir");
    return false;
  }

  /* Create & clear a temporary directory to store data in during the run */
  if (fs.existsSync(global.config.rampartTmpDir)) {
    deleteFolderRecursive(global.config.rampartTmpDir);
  }
  fs.mkdirSync(global.config.rampartTmpDir);

  if (global.config.reference) {
    /* the python mapping script needs a FASTA of the main reference */
    global.config.coordinateReferencePath = save_coordinate_reference_as_fasta(global.config.reference.sequence, global.config.rampartTmpDir);
  }

  /* LIST BASECALLED & DEMUXED FILES */
  const unsortedBasecalledFastqs = await getFastqsFromDirectory(global.config.basecalledPath);
  log(`  * Found ${unsortedBasecalledFastqs.length} basecalled fastqs in ${prettyPath(global.config.basecalledPath)}`);

  let unsortedAnnotatedFastqs = [];
  if (clearAnnotated) {
    log(`  * Clearing the annotated folder (${prettyPath(global.config.annotatedPath)})`);
    const annotatedFilesToDelete = await readdir(global.config.annotatedPath);
    for (const file of annotatedFilesToDelete) {
      fs.unlinkSync(path.join(global.config.annotatedPath, file));
    }
  } else {
    unsortedAnnotatedFastqs = await getFastqsFromDirectory(global.config.annotatedPath);
    log(`  * Found ${unsortedAnnotatedFastqs.length} annotated fastqs in ${prettyPath(global.config.annotatedPath)}`);
  }

  /* EXTRACT TIMESTAMPS FROM THOSE FASTQs */
  log(`  * Getting read times from basecalled and annotated files`);
  for (let fastq of unsortedBasecalledFastqs) {
    await setReadTime(fastq);
  }
  for (let fastq of unsortedAnnotatedFastqs) {
    await setReadTime(fastq);
  }
  setEpochOffset();

  /* sort the fastqs via these timestamps and push onto the appropriate deques */
  log(`  * Sorting available basecalled and annotated files based on read times`);
  unsortedAnnotatedFastqs
    .sort((a, b) => getReadTime(a)>getReadTime(b) ? 1 : -1)
    .forEach((f) => {
      addToParsingQueue(f);
      global.fastqsSeen.add(path.basename(f));
    })

  const annotatedBasenames = unsortedAnnotatedFastqs.map((name) => path.basename(name))
  unsortedBasecalledFastqs
    .filter((fastqPath) => !annotatedBasenames.includes(path.basename(fastqPath)))
    .sort((a, b) => getReadTime(a)>getReadTime(b) ? 1 : -1)
    .forEach((f) => {
      addToAnnotationQueue(f);
      global.fastqsSeen.add(path.basename(f))
    });

  log`RAMPART start up FINISHED\n`;
  return true;
}

module.exports = {startUp}

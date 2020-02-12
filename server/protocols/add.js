const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const fetch = require('node-fetch');
const util = require('util');
const streamPipeline = util.promisify(require('stream').pipeline);
const { getProtocolsPath, verbose, log } = require("../utils");

const main = async (args) => {

    const thisProtocolDir = path.join(getProtocolsPath(), args.name);
    if (fs.existsSync(thisProtocolDir)) {
        if (args.force) {
            verbose("protocols", `Removing existing folder for ${args.name}`)
            fs.rmdirSync(thisProtocolDir, { recursive: true });
        } else {
            return log(`The protocol ${args.name} already exists. If you want to overwrite, then run again with --force.`)
        }
    }

    const zipPath = await fetchZipFile(args.url);
    await extract(zipPath, thisProtocolDir, args.subdir)

    rm(zipPath)
    log(`Successfully added protocol "${args.name}"`)
}


async function extract(zipPath, protocolDir, subdir) {
    return new Promise((resolve, reject) => {
      fs.createReadStream(zipPath) 
          .pipe(unzipper.Parse()) // see https://www.npmjs.com/package/unzipper
          .on('entry', function (entry) {
            /* skip folders or things not in the identified subdirectory */
            if (
                entry.type !== "File" ||
                (subdir && !entry.path.includes(`${path.sep}${subdir}${path.sep}`))
            ) {
                return entry.autodrain(); // skip file / folder
            }

            /* where to write the file? */
            const filePartsToUse = subdir ?
                entry.path.split(`${path.sep}${subdir}${path.sep}`)[1].split(path.sep) :
                entry.path.split(path.sep).slice(1); // remove the root directory
            const pathToWrite = path.join(protocolDir, ...filePartsToUse);
            
            /* create the necessary subdirectories */
            if (!fs.existsSync(path.dirname(pathToWrite))) {
                fs.mkdirSync(path.dirname(pathToWrite), {recursive: true})
            }

            /* write the file */
            verbose("protocols", `Writing ${pathToWrite}`)
            entry.pipe(fs.createWriteStream(pathToWrite));
          })
          .on("error", (err) => reject(err))
          .on("close", () => resolve());
      });
  };
  

async function fetchZipFile(url) {
    const zipPath = path.join(getProtocolsPath(), "tmp.zip");
    // if (fs.existsSync(zipPath)) return zipPath // debug only
    rm(zipPath);
    verbose("protocols", `Downloading ${url} -> ${zipPath}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`unexpected response ${response.statusText}`)
    await streamPipeline(response.body, fs.createWriteStream(zipPath));
    return zipPath;
}

function rm(path) {
    if (fs.existsSync(path)) {
        fs.unlinkSync(path)
        return true;
    }
    return false;
}

module.exports = { default: main}
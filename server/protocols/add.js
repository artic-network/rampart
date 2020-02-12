const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const fetch = require('node-fetch');
const util = require('util');
const streamPipeline = util.promisify(require('stream').pipeline);
const { getProtocolsPath, verbose, log, warn, fatal } = require("../utils");

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

    /* Manage different sources  - URL (zips), local zip file, local directory */
    let zipPath, folderPath, shouldRemoveZip;
    if (args.source.match(/^http[s]?:\/\//)) {
        zipPath = await fetchZipFile(args.source);
        shouldRemoveZip=true;
    } else if (fs.existsSync(args.source) && path.parse(args.source).ext === ".zip") {
        zipPath = makePathAbsolute(args.source);
    } else if (fs.existsSync(args.source) && fs.lstatSync(args.source).isDirectory()) {
        if (args.subdir) warn("--subdir will be ignored when sourcing from a local directory")
        folderPath = makePathAbsolute(args.source)
    } else {
        fatal("Couldn't interpret provided protocol source!")
    }

    if (zipPath) {
        await extract(zipPath, thisProtocolDir, args.subdir)
        if (shouldRemoveZip) rm(zipPath)
    } else if (folderPath) {
        copyFolderSync(folderPath, thisProtocolDir)
    }
    log(`Successfully added protocol "${args.name}"`)
}


function copyFolderSync(from, to) {
    /* https://stackoverflow.com/a/52338335 */
    fs.mkdirSync(to);
    fs.readdirSync(from).forEach(element => {
        if (fs.lstatSync(path.join(from, element)).isFile()) {
            fs.copyFileSync(path.join(from, element), path.join(to, element));
        } else {
            copyFolderSync(path.join(from, element), path.join(to, element));
        }
    });

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

function makePathAbsolute(source) {
if (path.isAbsolute(source)) {
    return source
}
    return path.join(process.cwd(), source);
}

module.exports = { default: main}
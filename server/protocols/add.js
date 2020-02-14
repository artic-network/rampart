const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const fetch = require('node-fetch');
const util = require('util');
const streamPipeline = util.promisify(require('stream').pipeline);
const { getProtocolsPath, verbose, log, warn, fatal, rm, makePathAbsolute, fetchRegistry, checkSha256 } = require("../utils");

const main = async (args) => {
    if (args.name.match(/[\s/]/)) {
        fatal("Name contains invalid characters!");
    }

    const thisProtocolDir = path.join(getProtocolsPath(), args.name);
    if (fs.existsSync(thisProtocolDir)) {
        if (args.force) {
            verbose("protocols", `Removing existing folder for ${args.name}`)
            fs.rmdirSync(thisProtocolDir, { recursive: true });
        } else {
            return log(`The protocol ${args.name} already exists. If you want to overwrite, then run again with --force.`)
        }
    }

    if (args.url) {
        if (!args.url.match(/^http[s]?:\/\//)) {
            fatal("Provided URL is not valid!")
        }
        const zipPath = await fetchZipFile(args.url, args.name+".zip");
        await extract(zipPath, thisProtocolDir, args.subdir)
        if (!args.keepZip) rm(zipPath)
    } else if (args.local) {
        if (!fs.existsSync(args.local)) {
            fatal(`"${args.local}" doesn't exist`)
        }
        if (path.parse(args.local).ext === ".zip") {
            const zipPath = makePathAbsolute(args.local);
            await extract(zipPath, thisProtocolDir, args.subdir)
        } else if (fs.lstatSync(args.local).isDirectory()) {
            if (args.subdir) warn("--subdir will be ignored when sourcing from a local directory")
            const folderPath = makePathAbsolute(args.local);
            copyFolderSync(folderPath, thisProtocolDir);
        } else {
            fatal(`"${args.local}" must be either a zip file or a directory`)
        }
    } else {
        /* fetch from the registry! */
        const registry = await fetchRegistry();
        await addFromRegistry(registry, args.name, thisProtocolDir, args.keepZip)
    }
    log(`Successfully added protocol "${args.name}"`)
}

async function addFromRegistry(registry, name, protocolsDir, keepZip) {
    if (!registry.protocols[name]) fatal(`protocol not found in registry`)
    const zipPath = await fetchZipFile(registry.protocols[name].url, name+".zip");
    if (registry.protocols[name].sha256) {
        try {
            checkSha256(zipPath, registry.protocols[name].sha256)
            verbose("protocols", `sha256 ok: ${registry.protocols[name].sha256}`)
        } catch (err) {
            console.log(err)
            warn("File hash does not match!")
        }
    }
    await extract(zipPath, protocolsDir)
    if (!keepZip) rm(zipPath)
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
  

async function fetchZipFile(url, filename) {
    const zipPath = path.join(getProtocolsPath(), filename);
    // if (fs.existsSync(zipPath)) return zipPath // debug only
    rm(zipPath);
    verbose("protocols", `Downloading ${url} -> ${zipPath}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`unexpected response ${response.statusText}`)
    await streamPipeline(response.body, fs.createWriteStream(zipPath));
    return zipPath;
}


module.exports = { default: main, addFromRegistry}
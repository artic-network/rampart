const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { getProtocolsPath, warn } = require("../utils");

const main = (args) => {
    const protocolsPath = getProtocolsPath()
    let protocolDirs = fs.readdirSync(protocolsPath)
        .map((name) => [name, path.join(protocolsPath, name)])
        .filter(([, source]) => fs.lstatSync(source).isDirectory())

    if (args.name.length) {
        protocolDirs = protocolDirs.filter(([dir, ]) => args.name.includes(dir));
    }

    printDashedLine();
    if (global.VERBOSE) {
        printVerboseLine("Protocol", "File", "More Info")
    } else {
        printMainLine("Protocol", "Long Name")
    }
    printDashedLine();

    protocolDirs.forEach(([dir, dirPath], idx) => {
        try {
            if (idx) printDashedLine(); // not for first line!

            /* The protocol JSON contains name & description */
            let [errMsg, json] = analyseJSON(path.join(dirPath, "protocol.json"));
            if (!global.VERBOSE) {
                const longName = (errMsg || !json.name) ? "<No information provided>" : json.name;
                printMainLine(dir, longName);
                return;
            }
            printVerboseLine(dir, "protocol.json", errMsg || "Present");
            if (!errMsg) {
                printVerboseLine("", `→ name`, json.name || "Not provided");
                printVerboseLine("", `→ description`, json.description || "Not provided");
            }

            /* The genome JSON */
            [errMsg, json] = analyseJSON(path.join(dirPath, "genome.json"));
            printVerboseLine("", "genome.json", errMsg || "Present");
            if (!errMsg) {
                printVerboseLine("", `→ label`, json.label || "Not provided");
                printVerboseLine("", `→ reference`, json.reference ? `Label: ${json.reference.label}, Accession: ${json.reference.accession}` : "Not provided");
            }

            /* The primers JSON */
            [errMsg, json] = analyseJSON(path.join(dirPath, "primers.json"));
            printVerboseLine("", "primers.json", errMsg || "Present");
            if (!errMsg) {
                printVerboseLine("", `→ name`, json.name || "Not provided");
            }

            /* The pipelines JSON */
            [errMsg, json] = analyseJSON(path.join(dirPath, "pipelines.json"));
            printVerboseLine("", "pipelines.json", errMsg || "Present");
            if (!errMsg) {
                Object.keys(json).forEach((key) => {
                    printVerboseLine("", `→ ${key}`, `Pipeline: ${json[key].name}`);
                });
            }

        } catch (err) {
            console.log(err)
            warn(`Error parsing protocol ${dir}`)
        }
    })

    printDashedLine();
}

function printDashedLine() {
    console.log(chalk.cyan("".padEnd(process.stdout.columns > 100 ? 100 : process.stdout.columns, "-")))
}

function printMainLine(dirName, longName) {
    console.log(chalk.cyan(`${dirName.padEnd(20)}|  ${longName}`))
}

function printVerboseLine(protocol, key, value) {
    console.log(chalk.cyan(`${protocol.padEnd(20)}|  ${key.padEnd(15)}| ${value}`))
}

function analyseJSON(p) {
    if (!fs.existsSync(p) || fs.lstatSync(p).isDirectory()) {
        return ["Not specified.", null];
    }
    try {
        const json = JSON.parse(fs.readFileSync(p));
        return ["", json];
    } catch {
        return ["Not a valid JSON file!", null];
    }
}

module.exports = { default: main}
/**
 * Deals with server configuration at startup from command line arguments and configuration
 * files.
 * @type {module:fs}
 */
const fs = require('fs')
const path = require('path')
const { normalizePath, getAbsolutePath, verbose, log } = require("./utils");

const DEFAULT_PROTOCOL_PATH = "default_protocol";
const PROTOCOL_FILENAME= "protocol.json";
const GENOME_CONFIG_FILENAME= "genome.json";
const PRIMERS_CONFIG_FILENAME = "primers.json";
const PIPELINES_CONFIG_FILENAME = "pipelines.json";
const RUN_CONFIG_FILENAME = "run_configuration.json";

/**
 * Create initial config file from command line arguments - Note that
 * No data has been processed at this point.
 *
 * This will take configuration in the following order:
 *
 * [RAMPART_ROOT]/default_protocol/
 * [PROTOCOL_PATH]/
 * current working directory/
 *
 * the PROTOCOL_PATH is specified as an environment variable `RAMPART_PROTOCOL` or as a
 * command line option `--protocol`
 *
 * Configuration files looked for:
 * `genome.json` - a description of the layout of genes in the genome. Used for visualized
 *      the coverage maps.
 *
 * `primers.json` - a description of the location of amplicons in the current protocol
 *      (for visualization).
 *
 * `pipelines.json` - a list of pipelines available with paths to the Snakemake files. One
 *      pipeline named 'read_processor' is used to process reads for RAMPART and must be
 *      present. Other pipelines are used for post-RAMPART processing and analysis.
 *
 * `run_configuration.json` - This file provides the configuration for the current run
 *      (e.g., mapping of barcodes to samples, title of run, descriptions etc). It will
 *      usually be in the current working directory.
 *
 * Some of these options may also be overridden using command line options such as
 * `--barcodeNames`, `--title`, `--basecalledPath`
 *
 */

function ensurePathExists(path, {make=false}={}) {
    if (!fs.existsSync(path)) {
        if (make) {
            log(`Creating path ${path}`);
            fs.mkdirSync(path, {recursive: true})
        } else {
            throw new Error(`ERROR. Path ${path} doesn't exist.`);
        }
    }
};

function readConfigFile(paths, fileName) {
    let config = {};

    // iterate over the paths and if a file exists, read it on top of the
    // existing configuration object.
    paths.forEach( (path) => {
        const filePath = normalizePath(path) + fileName;
        if (fs.existsSync(filePath)) {
            verbose(`Reading ${fileName} from ${path}`);
            config = { ...config, ...JSON.parse(fs.readFileSync(filePath))};
            config.path = normalizePath(path); // add the path of the final config file read - for relative paths
        }
    });
    return config;
}

function findConfigFile(paths, fileName) {
    let foundFilePath = undefined;

    // iterate over the paths looking for the file, return the path to the last version found.
    paths.forEach( (path) => {
        const filePath = normalizePath(path) + fileName;
        if (fs.existsSync(filePath)) {
            foundFilePath = filePath;
        }
    });

    return foundFilePath;
}

function assert(item, message) {
    if (!item) {
        throw new Error(message);
    }
}

const getInitialConfig = (args) => {

    if (!process.argv[1].endsWith('rampart.js')) {
        throw new Error(`ERROR. Can't get RAMPART path from argv[1]: ${process.argv[1]}`);
    }
    const rampartPath = process.argv[1].substring(0, process.argv[1].length - 10);
    //verbose(`RAMPART path: ${rampartPath}`);

    const defaultProtocolPath = getAbsolutePath(DEFAULT_PROTOCOL_PATH, {relativeTo: rampartPath});
    //verbose(`Default protocol path: ${defaultProtocolPath}`);

    const pathCascade = [
        normalizePath(defaultProtocolPath) // always read config from the default protocol
    ];

    const userProtocol = args.protocol || (process.env.RAMPART_PROTOCOL || undefined);

    if (userProtocol) {
        const userProtocolPath = getAbsolutePath(userProtocol, {relativeTo: process.cwd()});

        //verbose(`Protocol path: ${userProtocolPath}`);

        pathCascade.push(normalizePath(userProtocolPath));
    }

    pathCascade.push("./"); // add current working directory

    const config = {
        run: {
            title: `Started @ ${(new Date()).toISOString()}`,
            annotatedPath: "annotations",
            clearAnnotated: false,
            simulateRealTime: 0
        }
    };

    config.protocol = readConfigFile(pathCascade, PROTOCOL_FILENAME);
    config.genome = readConfigFile(pathCascade, GENOME_CONFIG_FILENAME);
    config.primers = readConfigFile(pathCascade, PRIMERS_CONFIG_FILENAME);
    config.pipelines = readConfigFile(pathCascade, PIPELINES_CONFIG_FILENAME);
    config.run = { ...config.run, ...readConfigFile(pathCascade, RUN_CONFIG_FILENAME) };

    if (args.title) {
        config.run.title = args.title;
    }

    if (config.run.samples) {
        config.run.barcodeNames = {};

        // if barcode names have been specified then limit demuxing to only those barcodes...
        const limitBarcodesTo = [];
        config.run.samples.forEach((sample, index) => {
            sample.barcodes.forEach((barcode) => {
                // find an integer in the barcode name
                const matches = barcode.match(/(\d\d?)/);
                if (matches) {
                    limitBarcodesTo.push(parseInt(matches[1]));
                }
                config.run.barcodeNames[barcode] = {name: sample.name, order: index};
            })
        });

        if (limitBarcodesTo.length > 0) {
            config.run.limitBarcodesTo = [...limitBarcodesTo];
        }
    }

    // override with any barcode names on the arguments
    if (args.barcodeNames) {
        if (!config.run.barcodeNames) {
            config.run.barcodeNames = {};
        }

        const count = Object.keys(config.run.barcodeNames).length;
        args.barcodeNames.forEach((raw, index) => {
            const [barcode, name] = raw.split('=');
            if (barcode in config.run.barcodeNames) {
                // just override the name (not the order)
                config.run.barcodeNames[barcode].name = name;
            } else {
                // add a new name at the end
                config.run.barcodeNames[barcode] = {name, order: index + count}
            }
        });
    }

    // todo - check config objects for correctness
    assert(config.genome, "No genome description has been provided");
    assert(config.genome.label, "Genome description missing label");
    assert(config.genome.length, "Genome description missing length");
    assert(config.genome.genes, "Genome description missing genes");

    assert(config.pipelines, "No pipeline configuration has been provided");
    assert(config.pipelines.annotation, "Read proccessing pipeline ('annotation') not defined");

    if (args.basecalledDir) {
        config.run.basecalledPath = args.basecalledDir;
    }
    config.run.basecalledPath = getAbsolutePath(config.run.basecalledPath, {relativeTo: process.cwd()});
    verbose(`Basecalled path: ${config.run.basecalledPath}`);

    if (args.annotatedDir) {
        config.run.annotatedPath = args.annotatedDir;
    }
    config.run.annotatedPath = getAbsolutePath(config.run.annotatedPath, {relativeTo: process.cwd()});

    ensurePathExists(config.run.annotatedPath, {make: true});
    verbose(`Annotated path: ${config.run.annotatedPath}`);

    if (args.clearAnnotated) {
        config.run.clearAnnotated = args.clearAnnotated;
    }
    if (config.run.clearAnnotated){
        verbose("Clearing annotation directory");
    }

    if (args.simulateRealTime) {
        config.run.simulateRealTime = args.simulateRealTime;
    }
    if (config.run.simulateRealTime > 0){
        verbose(`Simulating real-time appearance of reads every ${config.run.simulateRealTime} seconds`);
    }

    config.pipelines.annotation.path = normalizePath(getAbsolutePath(config.pipelines.annotation.path, {relativeTo: config.pipelines.path}));
    config.pipelines.annotation.config = getAbsolutePath(config.pipelines.annotation.config_file, {relativeTo: config.pipelines.path});
    config.pipelines.annotation.configOptions = [];

    if (config.pipelines.annotation.requires) {
        config.pipelines.annotation.requires.forEach( (requirement) => {
            const filepath = findConfigFile(pathCascade, requirement.file);
            config.pipelines.annotation.configOptions.push(`${requirement.config_key}=${filepath}`);

            if (!filepath) {
                throw new Error(`Unable to find required file, ${requirement.file}, for pipeline, '${config.pipelines.annotation.name}'`);
            }
        })
    }

    if (config.run.limitBarcodesTo) {
        config.pipelines.annotation.configOptions.push(`barcodes=[${config.run.limitBarcodesTo.join(',')}]`);
    }

    if (args.annotationConfig) {
        // add pass-through options to the annotation script
        config.pipelines.annotation.configOptions.push(...args.annotationConfig);
    }

    ensurePathExists(config.pipelines.annotation.path);
    ensurePathExists(config.pipelines.annotation.path + "Snakefile");

    return config;
};

/**
 * update the config file via GUI provided data
 */

// todo - update this to remove bits about reference files
// const modifyConfig = ({config: newConfig, refFasta, refJsonPath, refJsonString}) => {
//
//     /* if client is sending us FASTA file */
//     if (refFasta) {
//         if (global.config.referencePanelPath) {
//             throw new Error("Shouldn't be able to supply a reference panel fasta when referencePanelPath exists");
//         }
//         newConfig.referencePanelPath = path.join(global.config.rampartTmpDir, "referencePanel.fasta");
//         fs.writeFileSync(newConfig.referencePanelPath, refFasta);
//         newConfig.referencePanel = parseReferenceInfo(newConfig.referencePanelPath);
//     }
//
//     /* if client is sending us JSON file -- either as a complete file-in-a-string or as a path to load */
//     if (refJsonString || refJsonPath) {
//         if (global.config.referenceConfigPath) {
//             throw new Error("Shouldn't be able to supply a reference config JSON when referenceConfigPath exists");
//         }
//
//         if (refJsonPath) {
//             ensurePathExists(refJsonPath);
//             newConfig.referenceConfigPath = refJsonPath;
//         } else {
//             newConfig.referenceConfigPath = path.join(global.config.rampartTmpDir, "reference.json");
//             fs.writeFileSync(newConfig.referenceConfigPath, refJsonString);
//         }
//
//         /* parse the "main reference" configuration file (e.g. primers, genes, ref seq etc) */
//         newConfig.reference = JSON.parse(fs.readFileSync(newConfig.referenceConfigPath)).reference;
//
//         /* the python mapping script needs a FASTA of the main reference */
//         newConfig.coordinateReferencePath = save_coordinate_reference_as_fasta(newConfig.reference.sequence, global.config.rampartTmpDir);
//     }
//
//     global.config = Object.assign({}, global.config, newConfig);
//
//     if (refFasta || refJsonPath || refJsonString) {
//         /* try to start the mapper, which may not be running due to insufficent
//         config information. It will exit gracefully if required */
//         mapper();
//     }
// };

/**
 * The config only knows about the barcodes seen by the data so far.
 * As we observe new ones, we must call this function
 */
const updateConfigWithNewBarcodes = () => {
    verbose("[updateConfigWithNewBarcodes]");
    const newBarcodes = global.datastore.getBarcodesSeen()
        .filter((bc) => !Object.keys(global.config.barcodeToName).includes(bc));
    newBarcodes.forEach((bc) => {
        global.config.barcodeToName[bc] = {name: undefined, order: 0}
    });
    global.CONFIG_UPDATED();
};

const updateWhichReferencesAreDisplayed = (refsToDisplay) => {
    let changed = false;
    global.config.referencePanel.forEach((info) => {
        if (info.display && !refsToDisplay.includes(info.name)) {
            changed = true;
            info.display = false;
        }
        if (!info.display && refsToDisplay.includes(info.name)) {
            changed = true;
            info.display = true;
        }
    });
    if (changed) {
        global.CONFIG_UPDATED();
    }
};


module.exports = {
    getInitialConfig,
    // modifyConfig,
    updateConfigWithNewBarcodes,
    updateWhichReferencesAreDisplayed
};

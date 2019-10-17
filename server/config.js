/**
 * Deals with server configuration at startup from command line arguments and configuration
 * files.
 * @type {module:fs}
 */
const fs = require('fs');
// const path = require('path')
const { normalizePath, getAbsolutePath, verbose, log, warn, fatal } = require("./utils");
const { getNthReferenceColour } = require("./colours");

const DEFAULT_PROTOCOL_PATH = "default_protocol";
const PROTOCOL_FILENAME= "protocol.json";
const GENOME_CONFIG_FILENAME= "genome.json";
const PRIMERS_CONFIG_FILENAME = "primers.json";
const PIPELINES_CONFIG_FILENAME = "pipelines.json";
const RUN_CONFIG_FILENAME = "run_configuration.json";

const UNMAPPED_LABEL = "unmapped";
const UNASSIGNED_LABEL = "unassigned";

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
 *      pipeline named 'annotator' is used to process reads for RAMPART and must be
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
            fs.mkdirSync(`"${path}"`, {recursive: true})
        } else {
            throw new Error(`ERROR. Path ${path} doesn't exist.`);
        }
    }
};

function readConfigFile(paths, fileName) {
    let config = {};

    try {
        // iterate over the paths and if a file exists, read it on top of the
        // existing configuration object.
        paths.forEach((path) => {
            const filePath = normalizePath(path) + fileName;
            if (fs.existsSync(filePath)) {
                verbose("config", `Reading ${fileName} from ${path}`);
                config = {...config, ...JSON.parse(fs.readFileSync(filePath))};
                config.path = normalizePath(path); // add the path of the final config file read - for relative paths
            }
        });
    } catch (err) {
        throw new Error(`Error reading file "${fileName}": ${err.message}`);
    }

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

function checkPipeline(config, pipeline, index = 0, giveWarning = false) {

    let message = undefined;

    if (!pipeline.name) {
        message = `is missing name`;
    }

    if (!message && !pipeline.path) {
        message = `is missing the path`;
    }

    pipeline.path = normalizePath(getAbsolutePath(pipeline.path, {relativeTo: config.pipelines.path}));

    if (!message && !fs.existsSync(pipeline.path)) {
        message = `path doesn't exist`;
    }

    if (!message && !fs.existsSync(pipeline.path + "Snakefile")) {
        message = `Snakefile doesn't exist`;
    }

    if (!message) {
        if (!pipeline.config_file) {
            pipeline.config_file = "config.yaml";
        }

        pipeline.config = getAbsolutePath(pipeline.config_file, {relativeTo: pipeline.path});
        pipeline.configOptions = {};

        if (!fs.existsSync(pipeline.config)) {
            message = `config file doesn't exist`;
        }
    }

    if (message) {
        if (giveWarning) {
            warn(`pipeline '${pipeline.name ? pipeline.name : index + 1}' ${message} - pipeline will be ignored`);
            pipeline.ignore = true;
        } else {
            throw new Error(`pipeline '${pipeline.name}' ${message}`);
        }
    }



}

const getInitialConfig = (args) => {
    const serverDir = __dirname;
    const rampartSourceDir = serverDir.substring(0, serverDir.length - 7); // no trailing slash

    const defaultProtocolPath = getAbsolutePath(DEFAULT_PROTOCOL_PATH, {relativeTo: rampartSourceDir});
    //verbose("config", `Default protocol path: ${defaultProtocolPath}`);

    const pathCascade = [
        normalizePath(defaultProtocolPath) // always read config from the default protocol
    ];

    const userProtocol = args.protocol || (process.env.RAMPART_PROTOCOL || undefined);

    if (userProtocol) {
        const userProtocolPath = getAbsolutePath(userProtocol, {relativeTo: process.cwd()});
        //verbose("config", `Protocol path: ${userProtocolPath}`);
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

    config.run.barcodeNames = {};
    if (config.run.samples) {

        // if barcode names have been specified then limit demuxing to only those barcodes...
        config.run.samples.forEach((sample, index) => {
            sample.barcodes.forEach((barcode) => {
                // // find an integer in the barcode name
                // const matches = barcode.match(/(\d\d?)/);
                // if (matches) {
                //     limitBarcodesTo.push(parseInt(matches[1]));
                // }
                config.run.barcodeNames[barcode] = {name: sample.name, order: index};
            });
        });
    }

    // override with any barcode names on the arguments
    if (args.barcodeNames) {
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

    config.genome.referencePanel = [{
        name: UNMAPPED_LABEL,
        description: "Reads that didn't map to any reference",
        display: true
    }];

    assert(config.pipelines, "No pipeline configuration has been provided");
    assert(config.pipelines.annotation, "Read proccessing pipeline ('annotation') not defined");
    ensurePathExists(config.pipelines.path);

    if (args.basecalledPath) {
        /* overwrite any JSON defined path with a command line arg */
        config.run.basecalledPath = args.basecalledPath;
    }
    try {
        config.run.basecalledPath = normalizePath(getAbsolutePath(config.run.basecalledPath, {relativeTo: process.cwd()}));
        verbose("config", `Basecalled path: ${config.run.basecalledPath}`);
    } catch (err) {
        console.error(err.message);
        // fatal(`Error finding / accessing the directory of basecalled reads ${config.run.basecalledPath}`)
        fatal(`No directory of basecalled reads specified in startup configuration`)
    }

    if (args.annotatedDir) {
        config.run.annotatedPath = args.annotatedDir;
    }
    config.run.annotatedPath = normalizePath(getAbsolutePath(config.run.annotatedPath, {relativeTo: process.cwd()}));
    config.run.workingDir = process.cwd();

    ensurePathExists(config.run.annotatedPath, {make: true});
    verbose("config", `Annotated path: ${config.run.annotatedPath}`);

    if (args.clearAnnotated) {
        config.run.clearAnnotated = args.clearAnnotated;
    }
    if (config.run.clearAnnotated){
        verbose("config", "Flag: 'Clearing annotation directory' enabled");
    }

    if (args.simulateRealTime) {
        config.run.simulateRealTime = args.simulateRealTime;
    }
    if (config.run.simulateRealTime > 0){
        verbose("config", `Simulating real-time appearance of reads every ${config.run.simulateRealTime} seconds`);
    }

    checkPipeline(config, config.pipelines.annotation);

    if (config.pipelines.annotation.requires) {
        // find any file that the pipeline requires
        config.pipelines.annotation.requires.forEach( (requirement) => {
            let filepath = findConfigFile(pathCascade, requirement.file);

            if (requirement.config_key === 'references_file' && args.referencesPath) {
                // override the references path if specified on the command line
                filepath = getAbsolutePath(args.referencesPath, {relativeTo: process.cwd()});
                ensurePathExists(filepath);
            }

            requirement.path = filepath;

            if (!filepath) {
                // throw new Error(`Unable to find required file, ${requirement.file}, for pipeline, '${config.pipelines.annotation.name}'`);
                warn(`Unable to find required file, ${requirement.file}, for pipeline, '${config.pipelines.annotation.name}'\n`);
            }

            // set this in config.run so the UI can find it.
            config.run.referencesPanel = filepath;

        });
    }

    // Add any annotationOptions from the protocol config file
    if (config.protocol.annotationOptions) {
        config.pipelines.annotation.configOptions = { ...config.pipelines.annotation.configOptions, ...config.protocol.annotationOptions };
    }

    // Add any annotationOptions options from the run config file
    if (config.run.annotationOptions) {
        config.pipelines.annotation.configOptions = { ...config.pipelines.annotation.configOptions, ...config.run.annotationOptions };
    }

    if (Object.keys(config.run.barcodeNames).length > 0) {
        config.pipelines.annotation.configOptions["limit_barcodes_to"] = Object.keys(config.run.barcodeNames).join(',');
    }

    // Add any annotationOptions options from the command line
    if (args.annotationConfig) {
        // add pass-through options to the annotation script
        args.annotationConfig.forEach( value => {
            const values = value.split("=");
            config.pipelines.annotation.configOptions[values[0]] = (values.length > 1 ? values[1] : "");
        });
    }

    // If other pipelines are specified, check them
    if (config.pipelines.processing) {
        config.pipelines.processing.forEach( (pipeline, index) => {
            checkPipeline(config, pipeline, index, true);
        });
    }

    /* display options */
    config.display = {
        numCoverageBins: 1000, /* how many bins we group the coverage stats into */
        readLengthResolution: 10,
        referenceMapCountThreshold: 5,
        maxReferencePanelSize: 10,
        logYAxis: false
    };

    // Add any display options from the protocol config file
    if (config.protocol.display) {
        config.display = { ...config.display, ...config.protocol.displayOptions };
    }

    // Add any display options options from the run config file
    if (config.run.displayOptions) {
        config.display = { ...config.display, ...config.run.displayOptions };
    }

    return config;
};

/**
 * update the global config object via client provided data
 * @param {Object} clientSettings new config paramaters send from the client
 * @returns {Boolean} whether a data recalculation is necessary
 * @sideEffect modifies global.config in place
 */
const modifyConfig = (clientSettings) => {
    if (clientSettings.hasOwnProperty("logYAxis")) {
        global.config.display.logYAxis = clientSettings.logYAxis;
    }
    return false;
};

// const modifyConfig = ({config: newConfig, refFasta, refJsonPath, refJsonString}) => {

//     /* if client is sending us the references file */
//     if (refFasta) {
//         if (global.config.referencePanelPath) {
//             throw new Error("Shouldn't be able to supply a reference panel fasta when referencePanelPath exists");
//         }
//         newConfig.referencePanelPath = path.join(global.config.rampartTmpDir, "referencePanel.fasta");
//         fs.writeFileSync(newConfig.referencePanelPath, refFasta);
//         newConfig.referencePanel = parseReferenceInfo(newConfig.referencePanelPath);
//     }

//     /* if client is sending us JSON file -- either as a complete file-in-a-string or as a path to load */
//     if (refJsonString || refJsonPath) {
//         if (global.config.referenceConfigPath) {
//             throw new Error("Shouldn't be able to supply a reference config JSON when referenceConfigPath exists");
//         }

//         if (refJsonPath) {
//             ensurePathExists(refJsonPath);
//             newConfig.referenceConfigPath = refJsonPath;
//         } else {
//             newConfig.referenceConfigPath = path.join(global.config.rampartTmpDir, "reference.json");
//             fs.writeFileSync(newConfig.referenceConfigPath, refJsonString);
//         }

//         /* parse the "main reference" configuration file (e.g. primers, genes, ref seq etc) */
//         newConfig.reference = JSON.parse(fs.readFileSync(newConfig.referenceConfigPath)).reference;

//         /* the python mapping script needs a FASTA of the main reference */
//         newConfig.coordinateReferencePath = save_coordinate_reference_as_fasta(newConfig.reference.sequence, global.config.rampartTmpDir);
//     }

//     global.config = Object.assign({}, global.config, newConfig);

//     if (refFasta || refJsonPath || refJsonString) {
//         /* try to start the mapper, which may not be running due to insufficent
//         config information. It will exit gracefully if required */
//         mapper();
//     }
// };


/**
 * The config contains a list of "seen" barcodes which the client therefore knows about.
 * If we observe a new barcode, then the config needs updating, and the client needs to
 * be notified.
 */
const updateConfigWithNewBarcodes = () => {
    const newBarcodes = global.datastore.getBarcodesSeen()
        .filter((bc) => !Object.keys(global.config.run.barcodeNames).includes(bc));
    if (!newBarcodes.length) {
        return;
    }
    verbose("config", `new barcodes seen! ${newBarcodes.join(" & ")}`);
    newBarcodes.forEach((bc) => {
        global.config.run.barcodeNames[bc] = {name: undefined, order: 0}
    });
    global.CONFIG_UPDATED();
};

/**
 * RAMPART doesn't know what references are out there, we can only add them as we see them
 * This updates the config store of the references, and triggers a client update if there are changes
 * @param {set} referencesSeen
 */
const updateReferencesSeen = (referencesSeen) => {
    const changes = [];
    const referencesInConfig = new Set([...global.config.genome.referencePanel.map((x) => x.name)]);
    referencesSeen.forEach((ref) => {
        if (ref !== UNMAPPED_LABEL && !referencesInConfig.has(ref)) {
            global.config.genome.referencePanel.push({
                name: ref,
                description: "to do",
                colour: getNthReferenceColour(global.config.genome.referencePanel.length),
                display: false
            });
            changes.push(ref);
        }
    });
    if (changes.length) {
        verbose("config", `new references seen: ${changes.join(" & ")}`);
        global.CONFIG_UPDATED();
    }
};

const updateWhichReferencesAreDisplayed = (refsToDisplay) => {
    let changed = false;
    for (const refInfo of Object.values(global.config.genome.referencePanel)) {
        if (refInfo.display && !refsToDisplay.includes(refInfo.name)) {
            changed = true;
            refInfo.display = false;
        }
        if (!refInfo.display && refsToDisplay.includes(refInfo.name)) {
            changed = true;
            refInfo.display = true;
        }
    }
    if (changed) {
        verbose("config", `updated which refs in the reference panel should be displayed`);
        global.CONFIG_UPDATED();
    }
};


module.exports = {
    getInitialConfig,
    modifyConfig,
    updateConfigWithNewBarcodes,
    updateWhichReferencesAreDisplayed,
    updateReferencesSeen,
    UNMAPPED_LABEL,
    UNASSIGNED_LABEL
};

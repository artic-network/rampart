/**
 * Deals with server configuration at startup from command line arguments and configuration
 * files.
 * @type {module:fs}
 */
const fs = require('fs')
// const path = require('path')
const { normalizePath, getAbsolutePath, verbose, log, warn, fatal } = require("./utils");
const { getNthReferenceColour } = require("./colours");

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
            verbose("config", `Reading ${fileName} from ${path}`);
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
    
    /* NOTE: as rampart becomes an executable on $PATH, this logic will need to change */
    if (!process.argv[1].endsWith('rampart.js')) {
        throw new Error(`ERROR. Can't get RAMPART path from argv[1]: ${process.argv[1]}`);
    }
    const rampartPath = process.argv[1].substring(0, process.argv[1].length - 10);
    //verbose("config", `RAMPART path: ${rampartPath}`);

    const defaultProtocolPath = getAbsolutePath(DEFAULT_PROTOCOL_PATH, {relativeTo: rampartPath});
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

    config.genome.referencePanel = [];

    assert(config.pipelines, "No pipeline configuration has been provided");
    assert(config.pipelines.annotation, "Read proccessing pipeline ('annotation') not defined");


    if (args.basecalledPath) {
        /* overwrite any JSON defined path with a command line arg */
        config.run.basecalledPath = args.basecalledPath;
    }
    try {
        config.run.basecalledPath = normalizePath(getAbsolutePath(config.run.basecalledPath, {relativeTo: process.cwd()}));
        verbose("config", `Basecalled path: ${config.run.basecalledPath}`);
    } catch (err) {
        console.error(err.message)
        // fatal(`Error finding / accessing the directory of basecalled reads ${config.run.basecalledPath}`)
        warn(`No directory of basecalled reads specified in startup configuration`)
    }

    if (args.annotatedDir) {
        config.run.annotatedPath = args.annotatedDir;
    }
    config.run.annotatedPath = normalizePath(getAbsolutePath(config.run.annotatedPath, {relativeTo: process.cwd()}));

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

    config.pipelines.annotation.path = normalizePath(getAbsolutePath(config.pipelines.annotation.path, {relativeTo: config.pipelines.path}));
    config.pipelines.annotation.config = getAbsolutePath(config.pipelines.annotation.config_file, {relativeTo: config.pipelines.path});
    config.pipelines.annotation.configOptions = [];

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

        });
    }

    if (Object.keys(config.run.barcodeNames).length > 0) {
        config.pipelines.annotation.configOptions.push(`barcodes=${Object.keys(config.run.barcodeNames).join(',')}`);
    }

    if (args.annotationConfig) {
        // add pass-through options to the annotation script
        config.pipelines.annotation.configOptions.push(...args.annotationConfig);
    }

    ensurePathExists(config.pipelines.annotation.path);
    ensurePathExists(config.pipelines.annotation.path + "Snakefile");

    /* display options */
    config.display = {
      numCoverageBins: 1000, /* how many bins we group the coverage stats into */
      readLengthResolution: 10
    }

    return config;
};

/**
 * update the config file via GUI provided data
 */
const modifyConfig = ({config: newConfig, refFasta, refJsonPath, refJsonString}) => {

    /* if client is sending us the references file */
    if (refFasta) {
        if (global.config.referencePanelPath) {
            throw new Error("Shouldn't be able to supply a reference panel fasta when referencePanelPath exists");
        }
        newConfig.referencePanelPath = path.join(global.config.rampartTmpDir, "referencePanel.fasta");
        fs.writeFileSync(newConfig.referencePanelPath, refFasta);
        newConfig.referencePanel = parseReferenceInfo(newConfig.referencePanelPath);
    }

    /* if client is sending us JSON file -- either as a complete file-in-a-string or as a path to load */
    if (refJsonString || refJsonPath) {
        if (global.config.referenceConfigPath) {
            throw new Error("Shouldn't be able to supply a reference config JSON when referenceConfigPath exists");
        }

        if (refJsonPath) {
            ensurePathExists(refJsonPath);
            newConfig.referenceConfigPath = refJsonPath;
        } else {
            newConfig.referenceConfigPath = path.join(global.config.rampartTmpDir, "reference.json");
            fs.writeFileSync(newConfig.referenceConfigPath, refJsonString);
        }

        /* parse the "main reference" configuration file (e.g. primers, genes, ref seq etc) */
        newConfig.reference = JSON.parse(fs.readFileSync(newConfig.referenceConfigPath)).reference;

        /* the python mapping script needs a FASTA of the main reference */
        newConfig.coordinateReferencePath = save_coordinate_reference_as_fasta(newConfig.reference.sequence, global.config.rampartTmpDir);
    }

    global.config = Object.assign({}, global.config, newConfig);

    if (refFasta || refJsonPath || refJsonString) {
        /* try to start the mapper, which may not be running due to insufficent
        config information. It will exit gracefully if required */
        mapper();
    }
};


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
        if (!referencesInConfig.has(ref)) {
            global.config.genome.referencePanel.push({
              name: ref,
              description: "to do",
              colour: getNthReferenceColour(global.config.genome.referencePanel.length),
              display: false
            });
            changes.push(ref);
        }
    })
    if (changes.length) {
        verbose("config", `new references seen: ${changes.join(" & ")}`);
        global.CONFIG_UPDATED();
    }
}

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
    };
    if (changed) {
        verbose("config", `updated which refs in the reference panel should be displayed`);
        global.CONFIG_UPDATED();
    }
};


module.exports = {
    getInitialConfig,
    updateConfigWithNewBarcodes,
    updateWhichReferencesAreDisplayed,
    updateReferencesSeen
};

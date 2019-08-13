/**
 * Deals with server configuration at startup from command line arguments and configuration
 * files.
 * @type {module:fs}
 */
const fs = require('fs')
const path = require('path')
const { getAbsolutePath, verbose, log } = require("./utils");
const { annotationParser } = require("./annotationParser");

const ensurePathExists = (p, {make=false}={}) => {
  if (!fs.existsSync(p)) {
    if (make) {
      log(`Creating path ${p}`);
      fs.mkdirSync(p, {recursive: true})
    } else {
      throw new Error(`ERROR. Path ${p} doesn't exist.`);
    }
  }
};

// Todo: remove - reference names are now compiled on the fly
// const getReferenceNames = (referencePanelPath) => {
//   return fs.readFileSync(referencePanelPath, "utf8")
//     .split("\n")
//     .filter((l) => l.startsWith(">"))
//     .map((n) => {
//       if (n.indexOf(" ") > 0) {
//         return {
//           "name": n.substring(1, n.indexOf(" ")), // fasta name is up until the first space
//           "description": n.substring(n.indexOf(" ")) // fasta description is the rest
//         };
//       } else {
//         return {
//           "name": n.substring(1),
//           "description": ""
//         };
//       }
//     });
// }

/* return format is array of {label: <label for display>, value: <path string>} */
const scanExampleConfigs = () => {
  const dir = path.join(__dirname, "..", "assets/includedConfigs");
  return fs.readdirSync(dir)
      .filter((p) => p.endsWith(".json"))
      .map((p) => ({value: path.join(dir, p), label: p}));
};

const DEFAULT_PROTOCOL_PATH = "default_protocol";
const GENOME_CONFIG= "genome.json";
const PRIMERS_CONFIG = "primers.json";
const PIPELINES_CONFIG = "pipelines.json";
const RUN_CONFIG = "run_configuration.json";

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

function readConfigFile(paths, fileName) {
  let config = {};

  // iterate over the paths and if a file exists, read it on top of the
  // existing configuration object.
  paths.forEach( (path) => {
    if (fs.existsSync(path + fileName)) {

      verbose(`Reading ${fileName} from ${path}`);
      config = { ...config, ...JSON.parse(fs.readFileSync(path + fileName))};
    }
  });
  return config;
}

const getInitialConfig = (args) => {

  const pathCascade = [
    getAbsolutePath(DEFAULT_PROTOCOL_PATH, {relativeTo: process.cwd()})
  ];

  let userProtocolPath = sys.getEnvironmentVariable("RAMPART_PROTOCOL");
  if (args.protocol) {
    userProtocolPath = args.protocol;
  }

  if (userProtocolPath) {
    pathCascade.append(userProtocolPath);
  }

  pathCascade.append("./");

  const config = {
    genome: readConfigFile(pathCascade, GENOME_CONFIG),
    primers: readConfigFile(pathCascade, PRIMERS_CONFIG),
    pipelines: readConfigFile(pathCascade, PIPELINES_CONFIG),
    run: readConfigFile(pathCascade, RUN_CONFIG)
  }

  // todo - check config objects for correctness

  // const config = {
  //   title: args.title ? args.title : `Started @ ${(new Date()).toISOString()}`,
  //   barcodeToName: {},
  //   rampartTmpDir: path.join(__dirname, "..", "tmp"), // TODO -- add to cmd line arguments
  //   basecalledPath: "",
  //   annotatedPath: "",
  //   referencePanel: [],
  //   reference: undefined,
  //   exampleConfigPaths: scanExampleConfigs()
  // };

}


const getInitialConfig_old = (args) => {

  const config = {
    title: args.title ? args.title : `Started @ ${(new Date()).toISOString()}`,
    barcodeToName: {},
    rampartTmpDir: path.join(__dirname, "..", "tmp"), // TODO -- add to cmd line arguments
    basecalledPath: "",
    annotatedPath: "",
    referencePanel: [],
    reference: undefined,
    exampleConfigPaths: scanExampleConfigs()
  };

  /* most options _can_ be specified on the command line, but may also be specified in the client */
  if (args.barcodeNames) {
    args.barcodeNames.forEach((raw, idx) => {
      const [bc, name] = raw.split('=');
      config.barcodeToName[bc] = {name, order: idx}
    });
  }

  if (config.barcodeToName) {
    // if barcode names have been specified then limit demuxing to only those barcodes...
    const limitBarcodesTo = [];
    for (barcode in config.barcodeToName) {
      var matches = barcode.match(/(\d\d?)/);
      if (matches) {
        limitBarcodesTo.push(matches[1]);
      }
    }
    if (limitBarcodesTo.length > 0) {
      config.limitBarcodesTo = [...limitBarcodesTo];
    }
  }

  if (args.basecalledDir) {
    config.basecalledPath = getAbsolutePath(args.basecalledDir, {relativeTo: process.cwd()});
  }

  if (args.annotatedDir) {
    config.annotatedPath = getAbsolutePath(args.annotatedDir, {relativeTo: process.cwd()});
    ensurePathExists(config.annotatedPath, {make: true});
  }

  // Todo: remove - references files are now dealt with by the mapping script
  // if (args.referencePanelPath) {
  //   ensurePathExists(args.referencePanelPath);
  //   config.referencePanelPath = getAbsolutePath(args.referencePanelPath, {relativeTo: process.cwd()});
  //   config.referencePanel = getReferenceNames(config.referencePanelPath);
  // }
  //
  // if (args.referenceConfigPath) {
  //   ensurePathExists(args.referenceConfigPath);
  //   config.referenceConfigPath = getAbsolutePath(args.referenceConfigPath, {relativeTo: process.cwd()});
  //   /* parse the "main reference" configuration file (e.g. primers, genes, ref seq etc) */
  //   const reference = JSON.parse(fs.readFileSync(config.referenceConfigPath)).reference;
  //   config.reference = reference;
  // }

  return config;
};

/**
 * update the config file via GUI provided data
 */

// todo - update this to remove bits about reference files
const modifyConfig = ({config: newConfig, refFasta, refJsonPath, refJsonString}) => {

  /* if client is sending us FASTA file */
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
}

/**
 * The config only knows about the barcodes seen by the data so far.
 * As we observe new ones, we must call this function
 */
const updateConfigWithNewBarcodes = () => {
  verbose("[updateConfigWithNewBarcodes]")
  const newBarcodes = global.datastore.getBarcodesSeen()
      .filter((bc) => !Object.keys(global.config.barcodeToName).includes(bc));
  newBarcodes.forEach((bc) => {
    global.config.barcodeToName[bc] = {name: undefined, order: 0}
  })
  global.CONFIG_UPDATED();
}

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
}


module.exports = {
  getInitialConfig,
  modifyConfig,
  updateConfigWithNewBarcodes,
  updateWhichReferencesAreDisplayed
};

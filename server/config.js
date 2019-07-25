const fs = require('fs')
const path = require('path')
const { getAbsolutePath, verbose, log } = require("./utils");
const { mapper, save_coordinate_reference_as_fasta } = require("./mapper");
const { getInitialReferenceColours } = require("./colours");

const ensurePathExists = (p, {make=false}={}) => {
    if (!fs.existsSync(p)) {
        if (make) {
            log(`Creating path ${p}`);
            fs.mkdirSync(p, {recursive: true})
        } else {
            throw new Error(`ERROR. Path ${p} doesn't exist.`);
        }
    }
}

const parseReferenceInfo = (referencePanelPath) => {
  const info = fs.readFileSync(referencePanelPath, "utf8")
    .split("\n")
    .filter((l) => l.startsWith(">"))
    .map((n) => {
      if (n.indexOf(" ") > 0) {
        return {
          "name": n.substring(1, n.indexOf(" ")), // fasta name is up until the first space
          "description": n.substring(n.indexOf(" ")), // fasta description is the rest
          "display": false // display in client?
        };
      } else {
        return {
          "name": n.substring(1),
          "description": "",
          "display": false // display in client?
        };
      }
    });
    const colours = getInitialReferenceColours(info.length);
    info.forEach((d, i) => {d.colour = colours[i]});
    return info;
}

/* return format is array of {label: <label for display>, value: <path string>} */
const scanExampleConfigs = () => {
  const dir = path.join(__dirname, "..", "assets/includedConfigs");
  return fs.readdirSync(dir)
    .filter((p) => p.endsWith(".json"))
    .map((p) => ({value: path.join(dir, p), label: p}));
};

/**
 * Create initial config file from command line arguments - Note that
 * No data has been processed at this point.
 */
const getInitialConfig = (args) => {

  // const barcodes = [
  //   "BC01", "BC02", "BC03", "BC04", "BC05", "BC06", "BC07", "BC08", "BC09", "BC10", "BC11", "BC12"
  // ];

  const config = {
    title: args.title ? args.title : `Started @ ${(new Date()).toISOString()}`,
    barcodeToName: {},
    demuxOption: "--native_barcodes",
    discardUnassigned: args.discardUnassigned,
    discardMiddle: args.discardMiddle,
    rampartTmpDir: path.join(__dirname, "..", "tmp"), // TODO -- add to cmd line arguments
    basecalledPath: "",
    demuxedPath: "",
    referenceConfigPath: "",
    referencePanelPath: "",  // supplied to the mapper
    coordinateReferencePath: "", // supplied to the mapper
    referencePanel: [], // all references in FASTA
    reference: undefined,
    relaxedDemuxing: args.relaxedDemuxing,
    exampleConfigPaths: scanExampleConfigs()
  };

  if (args.port) {
    global.serverPort = args.port + 1;
    global.socketPort = args.port + 2;
  }

  /* most options _can_ be specified on the command line, but may also be specified in the client */
  if (args.barcodeNames) {
    args.barcodeNames.forEach((raw, idx) => {
      const [bc, name] = raw.split('=');
      config.barcodeToName[bc] = {name, order: idx}
    });
  }

  if (args.rapidBarcodes) {
      config.demuxOption = "--rapid_barcodes"
  }
  if (args.limitBarcodesTo) {
    config.limitBarcodesTo = args.limitBarcodesTo
  }
  if (args.basecalledDir) {
    config.basecalledPath = getAbsolutePath(args.basecalledDir, {relativeTo: process.cwd()});
  }
  if (args.demuxedDir) {
    config.demuxedPath = getAbsolutePath(args.demuxedDir, {relativeTo: process.cwd()});
    ensurePathExists(config.demuxedPath, {make: true});
  }

  if (args.referencePanelPath) {
    ensurePathExists(args.referencePanelPath);
    config.referencePanelPath = getAbsolutePath(args.referencePanelPath, {relativeTo: process.cwd()});
    config.referencePanel = parseReferenceInfo(config.referencePanelPath);
  }

  if (args.referenceConfigPath) {
    ensurePathExists(args.referenceConfigPath);
    config.referenceConfigPath = getAbsolutePath(args.referenceConfigPath, {relativeTo: process.cwd()});
    /* parse the "main reference" configuration file (e.g. primers, genes, ref seq etc) */
    const reference = JSON.parse(fs.readFileSync(config.referenceConfigPath)).reference;
    config.reference = reference;
  }

  return config;
};

/**
 * update the config file via GUI provided data
 */
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

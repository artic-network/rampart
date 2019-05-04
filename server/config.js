const fs = require('fs')
const path = require('path')
const { getAbsolutePath, verbose, log, warn } = require("./utils");
const { mapper } = require("./mapper");

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

const getReferenceNames = (referencePanelPath) => {
  return fs.readFileSync(referencePanelPath, "utf8")
    .split("\n")
    .filter((l) => l.startsWith(">"))
    .map((n) => {
      if (n.indexOf(" ") > 0) {
        return {
          "name": n.substring(1, n.indexOf(" ")), // fasta name is up until the first space
          "description": n.substring(n.indexOf(" ")) // fasta description is the rest
        };
      } else {
        return {
          "name": n.substring(1),
          "description": ""
        };
      }
    });
}

/**
 * Create initial config file from command line arguments
 */
const getInitialConfig = (args) => {
  const barcodes = [
    "BC01", "BC02", "BC03", "BC04", "BC05", "BC06", "BC07", "BC08", "BC09", "BC10", "BC11", "BC12"
  ];

  const config = {
    title: args.title ? args.title : "",
    barcodeToName: {},
    barcodes,
    basecalledPath: "",
    demuxedPath: "",
    referenceConfigPath: "",
    referencePanelPath: "",
    referencePanel: [],
    reference: undefined,
    relaxedDemuxing: args.relaxedDemuxing,
  };

  /* most options _can_ be specified on the command line, but may also be specified in the client */
  barcodes.forEach((bc) => {
    config.barcodeToName[bc] = undefined;
  })
  if (args.barcodeNames) {
    args.barcodeNames.forEach((raw) => {
      const [bc, name] = raw.split('=');
      if (!barcodes.includes(bc)) {
        throw new Error(`Invalid barcode ${bc}`)
      }
      config.barcodeToName[bc] = name;
    });
  }

  if (args.basecalledDir !== "") {
    config.basecalledPath = getAbsolutePath(args.basecalledDir, {relativeTo: process.cwd()});
  }
  if (args.demuxedDir !== "") {
    config.demuxedPath = getAbsolutePath(args.demuxedDir, {relativeTo: process.cwd()});
    ensurePathExists(config.demuxedPath, {make: true});
  }

  if (args.referencePanelPath) {
    ensurePathExists(args.referencePanelPath);
    config.referencePanelPath = getAbsolutePath(args.referencePanelPath, {relativeTo: process.cwd()});
    config.referencePanel = getReferenceNames(config.referencePanelPath);
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
const modifyConfig = (newConfig) => {

  global.config.barcodeToName = newConfig.barcodeToName;

  if (!global.config.referencePanelPath && newConfig.referencePanelPath) {
    try {
      ensurePathExists(newConfig.referencePanelPath);
      // take approprieate action?
    } catch (err) {
      warn(err.message);
      newConfig.referencePanelPath = "";
    }
  }

  global.config = Object.assign({}, global.config, newConfig);

  /* try to start the mapper, which may not be running due to insufficent
  config information. It will exit gracefully if required */
  mapper();

}


module.exports = {
    getInitialConfig,
    modifyConfig
};

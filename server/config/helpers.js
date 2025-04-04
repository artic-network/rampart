/*
 * Copyright (c) 2019 ARTIC Network http://artic.network
 * https://github.com/artic-network/rampart
 *
 * This file is part of RAMPART. RAMPART is free software: you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version. RAMPART is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 * See the GNU General Public License for more details. You should have received a copy of the GNU General Public License
 * along with RAMPART. If not, see <http://www.gnu.org/licenses/>.
 *
 */


/**
 * ------------------------------------------------------------------------
 * This file contains helper functions for config related tasks
 * ------------------------------------------------------------------------
 */

const fs = require('fs');
const dsv = require('d3-dsv');
const { normalizePath, getAbsolutePath, verbose, warn, fatal } = require("../utils");


function readConfigFile(paths, fileName) {
    let config = {};

    try {
        // iterate over the paths and if a file exists, read it on top of the
        // existing configuration object.
        paths.forEach((path) => {
            const filePath = normalizePath(path) + fileName;
            if (fs.existsSync(filePath)) {
                verbose("config", `Reading ${fileName} from ${path}`);
                const newConfig = JSON.parse(fs.readFileSync(filePath));

                // if any of the subobjects have a path element, update it to be relative to the current file
                Object.values(newConfig).forEach((value) => {
                    if (value.path) {
                        value.path = normalizePath(getAbsolutePath(value.path, {relativeTo: path}));
                    }
                });
                config = {...config, ...newConfig};
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
        fatal(message);
    }
}


const getBarcodesInConfig = (config) => {
    const barcodesDefined = new Set();
    config.run.samples.forEach((s) => {
        s.barcodes.forEach((b) => {
            barcodesDefined.add(b);
        })
    })
    return barcodesDefined;
}


/**
 * Set the samples if a barcode CSV file is provided.
 * This will overwrite any samples currently in the config.
 */
function setBarcodesFromFile(config, barcodeFile) {
    try {
        verbose("config", `Reading sample to barcode mapping from ${barcodeFile}`);
        const samples = dsv.csvParse(fs.readFileSync(barcodeFile).toString());

        let samplesKey = null;
        let barcodesKey = null;
        samples.columns.forEach(col => {
            // trim() removes the BOM ('\uFEFF` used as a marker for byte order in UTF-8 files)
            if (col.trim().toUpperCase().startsWith("SAMPLE")) {
                samplesKey = col;
            }
            if (col.trim().toUpperCase().startsWith("BARCODE")) {
                barcodesKey = col;
            }
        });

        if (samplesKey == null) {
            warn("No sample column found in barcode mapping file: " + barcodeFile);
            return;
        }

        if (barcodesKey == null) {
            warn("No barcode column found in barcode mapping file: " + barcodeFile);
            return;
        }


        const sampleMap = samples.reduce( (sampleMap, d) => {
//          sampleMap[d.sample] = (d.sample in sampleMap ? [...sampleMap[d.sample], d.barcode] : [d.barcode]);
            sampleMap[d[samplesKey]] = (d[samplesKey] in sampleMap ?
                [...sampleMap[samplesKey], d[barcodesKey]] : [d[barcodesKey]]);
            return sampleMap;
        }, {});

        if (config.run.samples.length) {
            verbose("config", `Overriding existing barcode - sample name mapping`);
        }

        config.run.samples = Object.keys(sampleMap).map((d) => {
            return {
                'name': d,
                'description': "",
                'barcodes': sampleMap[d]
            };
        });
    } catch (err) {
        warn(err);

        warn("Unable to read barcode to sample map file: " + barcodeFile)
    }
}

module.exports = {
    readConfigFile,
    findConfigFile,
    assert,
    getBarcodesInConfig,
    setBarcodesFromFile
}
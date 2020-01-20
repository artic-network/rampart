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

const fs = require('fs');
const { getAbsolutePath, warn, fatal, ensurePathExists, verbose } = require("../utils");
const { assert, findConfigFile, getBarcodesInConfig } = require("./helpers");

function setUpPipelines(config, args, pathCascade) {

    /* general assertions */
    assert(config.pipelines, "No pipeline configuration has been provided");
    ensurePathExists(config.pipelines.path);

    /* The annotation pipeline is somewhat special & we set this up here */
    setUpAnnotationPipeline(config, args, pathCascade)

    // If other pipelines are specified, check them
    config.pipelines.processing = Object.values(config.pipelines)
        .filter( (pipeline) => pipeline.processing );
    config.pipelines.processing.forEach( (pipeline, index) => {
        checkPipeline(config, pipeline, index, true);
    });

}



/**
 * The annotation pipeline is somewhat special & we set this up here
 */
function setUpAnnotationPipeline(config, args, pathCascade) {
    assert(config.pipelines.annotation, "Read proccessing pipeline ('annotation') not defined");
    checkPipeline(config, config.pipelines.annotation, 0);

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
                fatal(`Unable to find required file, ${requirement.file}, for pipeline, '${config.pipelines.annotation.name}'\n`);
            }

            // set this in config.run so the UI can find it.
            config.run.referencesPanel = filepath;

        });
    }

    /* You can specify config overrides to the annotation via the protocol JSON, the run JSON and via command line args. */
    // Add any annotationOptions from the protocol config file
    if (config.protocol.annotationOptions) {
        config.pipelines.annotation.configOptions = { ...config.pipelines.annotation.configOptions, ...config.protocol.annotationOptions };
    }
    // Add any annotationOptions options from the run config file
    if (config.run.annotationOptions) {
        config.pipelines.annotation.configOptions = { ...config.pipelines.annotation.configOptions, ...config.run.annotationOptions };
    }
    // Add any annotationOptions options from the command line
    if (args.annotationOptions) {
        // add pass-through options to the annotation script
        args.annotationOptions.forEach( value => {
            const values = value.split("=");
            config.pipelines.annotation.configOptions[values[0]] = (values.length > 1 ? values[1] : "");
        });
    }

    // if any samples have been set (and therefore associated with barcodes) then we limit the run to those barcodes
    // by setting an
    if (config.run.samples.length) {
        config.pipelines.annotation.configOptions["limit_barcodes_to"] = [...getBarcodesInConfig(config)].join(',');
        verbose("config", `Limiting barcodes to: ${config.pipelines.annotation.configOptions["limit_barcodes_to"]}`)
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


module.exports = {
  setUpPipelines
}

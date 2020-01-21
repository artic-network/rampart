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
const path = require('path');
const { getAbsolutePath, warn, fatal, ensurePathExists, verbose } = require("../utils");
const { assert, findConfigFile, getBarcodesInConfig } = require("./helpers");
const { addToParsingQueue } = require("../annotationParser");
const { PipelineRunner } = require('../PipelineRunner');

/**
 * Perform error checking etc on the pipelines defined in the config
 * and create pipeline runners for each one as applicable.
 * @returns {object} pipeline runners for each (valid) pipeline
 */
function setUpPipelines(config, args, pathCascade) {
    const pipelineRunners = {}

    /* general assertions / corrections */
    assert(config.pipelines, "No pipeline configuration has been provided");
    ensurePathExists(config.pipelines.path);
    assert(config.pipelines.annotation, "Processing pipeline must define an `annotation` pipeline");

    Object.entries(config.pipelines)
        .filter(([key, pipeline]) => key !== "path") // this key is introduced by us upon parsing
        .forEach(([key, pipeline]) => {
            pipeline.key = key; /* adding this allows us to easily reference the runners via the key */

            /* If there are no config options defined, then set them to the empty object */
            if (!pipeline.configOptions) {
                pipeline.configOptions = {};
            }

            if (key === "annotation") {
                /* the `annotation` pipeline is somewhat special */
                checkPipeline(config, pipeline);
                
                parseAnnotationRequires(pipeline, config, pathCascade, args)
                mergeAdditionalAnnotationOptions(pipeline.configOptions, config, args);
                // if any samples have been set (and therefore associated with barcodes) then we limit the run to those barcodes
                if (config.run.samples.length) {
                    if (pipeline.configOptions.limit_barcodes_to) {
                        warn("Overriding your `limit_barcodes_to` options to those set via the barcode-sample mapping.")
                    }
                    pipeline.configOptions.limit_barcodes_to = [...getBarcodesInConfig(config)].join(',');
                    verbose("config", `Limiting barcodes to: ${pipeline.configOptions.limit_barcodes_to}`)
                }
                // set up the runner
                pipelineRunners[key] = new PipelineRunner({
                    config: pipeline,
                    onSuccess: (job) => {addToParsingQueue(path.join(config.run.annotatedPath, job.filename_stem + '.csv'));},
                    queue: true
                });
            } else {
                /* a "normal" / non-annotation pipeline */
                if (!pipeline.processing || !pipeline.run_per_sample) {
                    /* we currently only use pipelines which are `processing` AND `run_per_sample`*/
                    /* NOTE: the client will filter these out as well, so we don't delete them here */
                    warn(`Pipeline ${pipeline.name} isn't "processing" and "run_per_sample" and will therefore be ignored`);
                    return;
                }
                verbose("config", `Constructing pipeline runner for "${pipeline.name}"`)
                checkPipeline(config, pipeline, true);
                pipelineRunners[key] = new PipelineRunner({config: pipeline, queue: true});
            }
        });

    return pipelineRunners;
}

/**
 * You can specify config overrides to the annotation via (i) the protocol JSON (ii) the run JSON and
 * (iii) the command line args. Here we modify the `configOptions` accordingly.
 * @param {object} configOptions starting configOptions
 * @param {object} config entire config object
 * @param {object} args cmd line args object
 * @returns {object} "updated" configOptions
 */
function mergeAdditionalAnnotationOptions(configOptions, config, args) {
    // Add any annotationOptions from the protocol config file
    if (config.protocol.annotationOptions) {
        configOptions = { ...configOptions, ...config.protocol.annotationOptions };
    }
    // Add any annotationOptions options from the run config file
    if (config.run.annotationOptions) {
        configOptions = { ...configOptions, ...config.run.annotationOptions };
    }
    // Add any annotationOptions options from the command line
    if (args.annotationOptions) {
        // add pass-through options to the annotation script
        args.annotationOptions.forEach( value => {
            const values = value.split("=");
            configOptions[values[0]] = (values.length > 1 ? values[1] : "");
        });
    }
}

/**
 * convert the `requires` property into paths and injects them into the `configOptions`, potentially with a cmd-line override.
 * This is only done for the `annotation` pipeline, but I presume it should be generalised for all pipelines?
 * (james, jan 2020)
 * @param {object} pipeline pipeline section of the config file
 * @param {object} config entire config object
 */
function parseAnnotationRequires(pipeline, config, pathCascade, args) {
    if (pipeline.requires) {
        pipeline.requires.forEach((requirement) => {

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

            // finally, transfer them to the `configOptions`
            pipeline.configOptions[requirement.config_key] = requirement.path;
        });
    }
}

function checkPipeline(config, pipeline, giveWarning = false) {

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

    if (!message && pipeline.config_file) {
        /* the config file is relative to the snakemake file */
        if (!fs.existsSync(getAbsolutePath(pipeline.config_file, {relativeTo: pipeline.path}))) {
            message = `config file doesn't exist`;
        }
    }

    if (message) {
        if (giveWarning) {
            warn(`pipeline '${pipeline.name}' ${message} - pipeline will be ignored`);
            pipeline.ignore = true;
        } else {
            throw new Error(`pipeline '${pipeline.name}' ${message}`);
        }
    }

}


module.exports = {
  setUpPipelines
}

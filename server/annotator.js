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

const path = require('path');
const { addToParsingQueue } = require("./annotationParser");
const { PipelineRunner } = require('./PipelineRunner');


const setUpAnnotationRunner = () => {
    let configOptions = {};

    // include optional additional configuration options from configuration files or arguments
    if (global.config.pipelines.annotation.configOptions) {
        configOptions = { ...global.config.pipelines.annotation.configOptions };
    }

    // find any file that the pipeline requires
    if (global.config.pipelines.annotation.requires) {
        global.config.pipelines.annotation.requires.forEach( (requirement) => {
            configOptions[requirement.config_key] = requirement.path;
        });
    }

    const onSuccess = (job) => {
        addToParsingQueue(path.join(global.config.run.annotatedPath, job.filename_stem + '.csv'));
    };

    const annotationRunner = new PipelineRunner({
        name: "annotator",
        snakefile: global.config.pipelines.annotation.path + "Snakefile",
        configfile: global.config.pipelines.annotation.path + global.config.pipelines.annotation.config_file,
        configOptions,
        onSuccess,
        queue: true
    });

    return annotationRunner;
};




module.exports = { setUpAnnotationRunner };

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
const { PipelineRunner } = require('./PipelineRunner');


const triggerPostProcessing = async (options) => {

    if (options.pipeline.name !== "Export reads") {
        global.io.emit("infoMessage", `post processing for "${options.pipeline.name}" is not yet supported`);
    }

    /* set up the pipeline.... */
    /* this needs to be made generic (i.e. not hard-coded for any particular pipeline)
    as pipelines should be fully definable via the config file. This means that _all_ the
    required information on how to run it needs to come from
    (a) the options.pipeline (which is identical to the server's `global.config.pipelines["post-processing"]` entry)
    (b) generic client-supplied info such as `sampleName`, read-lengths etc etc.
    It may be possible to define an interface in the config which the client can render & the user
    can enter in options / params, but this needs to be thorugh through */

    global.io.emit("infoMessage", `POST PROCESSING TRIGGERED // ${options.pipeline.name} // ${options.sampleName}`);

    const runner = new PipelineRunner({
        name: options.pipeline.name,
        snakefile: path.join(options.pipeline.path, "Snakefile"),
        configfile: options.pipeline.config_file ? path.join(options.pipeline.path, options.pipeline.config_file) : false,
        configOptions: []
    });

    /* set up job parameters defined via `options.pipeline.options` */
    const job = {...options.userSettings};
    if (options.pipeline.options.annotated_path) job.annotated_path = global.config.run.annotatedPath;
    if (options.pipeline.options.basecalled_path) job.basecalled_path = global.config.run.basecalledPath;
    if (options.pipeline.options.output_path) job.output_path = global.config.run.workingDir;

    // if (options.pipeline.options.sample_name) job.sample_name = options.sampleName;
    // if (options.pipeline.options.barcodes) job.barcodes = global.datastore.getBarcodesForSampleName(options.sampleName)

    if (options.pipeline.options.barcodes) {
        const sampleNames = (/*options.sampleName ? [ options.sampleName ] :*/ [...config.run.samples.map( d => d.name )]);
        const sampleMap = sampleNames.map( d => {
            const barcodes = global.datastore.getBarcodesForSampleName(options.sampleName);
            return `${d}: [${barcodes.join(',')}]`;
        });
        job.samples = `{${sampleMap.join(',')}}`;
    }

    try { // await will throw if the Promise (returned by runner.runJob()) rejects
        await runner.runJob(job);
    } catch (err) {
        global.io.emit("infoMessage", `POST PROCESSING FAILED // ${options.pipeline.name} // ${options.sampleName} // ${err.toString()}`);
        return;
    }
    global.io.emit("infoMessage", `POST PROCESSING SUCCESS // ${options.pipeline.name} // ${options.sampleName}`);
}

module.exports = {
    triggerPostProcessing
};

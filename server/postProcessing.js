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
const { log } = require("./utils");

const triggerPostProcessing = async ({pipelineKey, sampleName}) => {
    const pipelineRunner = global.pipelineRunners[pipelineKey];
    log(`Running ${pipelineRunner._name} for sample ${sampleName}`);

    /* construct a Job to be run */

    pipelineRunner.addToQueue({});


    // /* set up job parameters defined via `options.pipeline.options` */
    // const job = {...options.userSettings};
    // if (options.pipeline.options.annotated_path) job.annotated_path = global.config.run.annotatedPath;
    // if (options.pipeline.options.basecalled_path) job.basecalled_path = global.config.run.basecalledPath;
    // if (options.pipeline.options.output_path) job.output_path = global.config.run.workingDir;

    // // if (options.pipeline.options.sample_name) job.sample_name = options.sampleName;
    // // if (options.pipeline.options.barcodes) job.barcodes = global.datastore.getBarcodesForSampleName(options.sampleName)

    // if (options.pipeline.options.barcodes) {
    //     const sampleNames = (/*options.sampleName ? [ options.sampleName ] :*/ [...config.run.samples.map( d => d.name )]);
    //     const sampleMap = sampleNames.map( d => {
    //         const barcodes = global.datastore.getBarcodesForSampleName(options.sampleName);
    //         return `${d}: [${barcodes.join(',')}]`;
    //     });
    //     job.samples = `{${sampleMap.join(',')}}`;
    // }

    // try { // await will throw if the Promise (returned by runner.runJob()) rejects
    //     await runner.runJob(job);
    // } catch (err) {
    //     global.io.emit("infoMessage", `POST PROCESSING FAILED // ${options.pipeline.name} // ${options.sampleName} // ${err.toString()}`);
    //     return;
    // }
    // global.io.emit("infoMessage", `POST PROCESSING SUCCESS // ${options.pipeline.name} // ${options.sampleName}`);
}


module.exports = {
    triggerPostProcessing
};

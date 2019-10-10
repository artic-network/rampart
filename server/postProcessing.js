const path = require('path');
const { PipelineRunner } = require('./PipelineRunner');






const triggerPostProcessing = async (options) => {
  console.log("triggerPostProcessing options:", options);

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
    snakefile: path.join(global.config.pipelines.path, options.pipeline.path) + "Snakefile",
    configfile: false,
    configOptions: [],
    onSuccess: () => {global.io.emit("infoMessage", `post processing for "${options.pipeline.name}" FINISHED`);},
    queue: false
  });
  // all of the following settings are specific to the "Export reads" pipeline & need to be made generic
  const barcodes = [];
  for (const [bc, obj] of Object.entries(global.config.run.barcodeNames)) {
    if (obj.name === options.sampleName) barcodes.push(bc);
  }
  try { // await will throw if the Promise (returned by runner.runJob()) rejects
      await runner.runJob({
      input_path: global.config.run.basecalledPath,
      output_path: global.config.run.workingDir,
      barcodes,
      annotated_path: global.config.run.annotatedPath,
      min_length: 0,
      max_length: 100000000,
      sample: options.sampleName
    });
  } catch (err) {
    global.io.emit("infoMessage", `POST PROCESSING FAILED // ${options.pipeline.name} // ${options.sampleName}`);
  }
  global.io.emit("infoMessage", `POST PROCESSING SUCCESS // ${options.pipeline.name} // ${options.sampleName}`);
}

module.exports = {
  triggerPostProcessing
};

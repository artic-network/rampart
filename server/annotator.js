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
    }

    const annotationRunner = new PipelineRunner({
        name: "annotator",
        snakefile: global.config.pipelines.annotation.path + "Snakefile",
        configfile: global.config.pipelines.annotation.path + global.config.pipelines.annotation.config_file,
        configOptions,
        onSuccess,
        queue: true
    });
    return annotationRunner;
}




module.exports = { setUpAnnotationRunner };

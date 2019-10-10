const path = require('path');
const { addToParsingQueue } = require("./annotationParser");
const { PipelineRunner } = require('./PipelineRunner');


const setUpAnnotationRunner = () => {
    const configOptions = [];

    // find any file that the pipeline requires
    if (global.config.pipelines.annotation.requires) {
        global.config.pipelines.annotation.requires.forEach( (requirement) => {
            configOptions.push(`${requirement.config_key}=${requirement.path}`);
        } );
    }

    // include optional additional configuration options from configuration files or arguments
    if (global.config.pipelines.annotation.configOptions) {
        Object.keys(global.config.pipelines.annotation.configOptions).forEach( key => {
            configOptions.push(`${key}=${global.config.pipelines.annotation.configOptions[key]}`);
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

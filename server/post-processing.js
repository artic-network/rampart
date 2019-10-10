


const triggerPostProcessing = (options) => {
  console.log("triggerPostProcessing options:", options);
  global.io.emit("infoMessage", `POST PROCESSING TRIGGERED // ${options.pipeline.name} // ${options.sampleName}`);
}

module.exports = {
  triggerPostProcessing
};

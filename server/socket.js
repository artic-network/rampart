const fs = require('fs')
const { modifyConfig } = require("./config");
const { verbose, warn } = require("./utils");
const { startUp } = require("./startUp");
const { startBasecalledFilesWatcher } = require("./watchBasecalledFiles");
const { saveFastq } = require("./saveFastq");

/**
 * Collect data (from global.datastore) and send to client
 */
const sendData = () => {
  verbose("[sendData]")
  const data = global.datastore.getDataForClient();
  if (data === false) return;
  const {dataPerSample, combinedData, viewOptions} = data;
  global.io.emit("infoMessage", `New data`);
  global.io.emit('data', {dataPerSample, combinedData, viewOptions});
}

global.NOTIFY_CLIENT_DATA_UPDATED = () => sendData();

/**
 * Send config over the socket
 */
const sendConfig = () => {
  verbose("[sendConfig]")
  global.io.emit("infoMessage", `New config`);
  global.io.emit("config", global.config);
}

global.CONFIG_UPDATED = () => sendConfig();


/**
 * client has just connected
 */
const initialConnection = (socket) => {
  if (!global.config.basecalledPath) {
    verbose("[noBasecalledPath]")
    return socket.emit("noBasecalledPath")
  }
  sendConfig();
  sendData();
}

const setUpIOListeners = (socket) => {
  verbose("[setUpIOListeners] (socket for client - server communication)")
  socket.on('config', (newConfig) => {
    try {
      modifyConfig(newConfig);
      global.datastore.reprocessAllDatapoints();
    } catch (err) {
      console.log(err.message);
      warn("setting of new config FAILED")
      return;
    }
    sendData(); /* as the barcode -> names may have changed */
    sendConfig();
  });
  socket.on('basecalledAndDemuxedPaths', async (clientData) => {
    verbose("[basecalledAndDemuxedPaths]")
    global.config.basecalledPath = clientData.basecalledPath;
    global.config.annotatedPath = clientData.annotatedPath;
    const success = await startUp({emptyDemuxed: true}); // TODO
    if (success) {
      verbose("[basecalledAndDemuxedPaths] success")
      sendConfig();
      startBasecalledFilesWatcher();

    } else {
      verbose("[basecalledAndDemuxedPaths] failed")
      setTimeout(() => socket.emit("noBasecalledPath"), 100);
    }
  })
  socket.on("doesPathExist", (data) => {
    return socket.emit("doesPathExist", {
      path: data.path,
      exists: fs.existsSync(data.path)
    });
  });
  socket.on("saveDemuxedReads", (data) => {
    try {
      saveFastq({sampleName: data.sampleName, outputDirectory: data.outputDirectory, filters: data.filters});
    } catch (err) {
      console.trace(err);
      warn(`Error during [saveDemuxedReads]`)
      global.io.emit("showWarningMessage", `Error during [saveDemuxedReads]`);
    }
  })
}

module.exports = {
  initialConnection,
  setUpIOListeners
};

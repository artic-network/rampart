const fs = require('fs')
const { modifyConfig, updateConfigWithNewBarcodes} = require("./config");
const { verbose, log, warn } = require("./utils");
const { timerStart, timerEnd } = require('./timers');
const { getData } = require("./transformResults");
const { startUp } = require("./startUp");
const { startBasecalledFilesWatcher } = require("./watchBasecalledFiles");

/**
 * Collect all data (from global.datastore) and send to client
 */
const sendData = () => {
  timerStart("sendData");
  verbose("[sendData]")
  const {response, newBarcodesSeen} = getData();
  global.io.emit('data', response);
  timerEnd("sendData");
  if (newBarcodesSeen) {
    updateConfigWithNewBarcodes();
    sendConfig();
  }
}

/**
 * Send config over the socket
 */
const sendConfig = () => {
  verbose("[sendConfig]")
  global.io.emit("config", global.config);
}

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
    global.config.demuxedPath = clientData.demuxedPath;
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
}

const datastoreUpdated = () => {
  verbose("[datastoreUpdated]");
  sendData();
}
global.TMP_DATASTORE_UPDATED_FUNC = datastoreUpdated;

module.exports = {
  initialConnection,
  setUpIOListeners,
  datastoreUpdated
};

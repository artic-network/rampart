const modifyConfig = require("./config").modifyConfig;
const { verbose, log } = require("./utils");
const { timerStart, timerEnd } = require('./timers');
const { getData } = require("./transformResults");

/**
 * Collect all data (from global.datastore) and send to client
 */
const sendData = () => {
  timerStart("sendData");
  verbose("[sendData]")
  global.io.emit('data', getData());
  timerEnd("sendData");
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
  verbose("[setUpIOListeners]")
  socket.on('config', (newConfig) => {
    console.log("!!!!!!")
    modifyConfig(newConfig);
    sendData(); /* as the barcode -> names may have changed */
    sendConfig();
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

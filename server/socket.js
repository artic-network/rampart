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

const { verbose, warn } = require("./utils");
// const { saveFastq } = require("./saveFastq");
const { modifyConfig } = require("./config");
const { triggerPostProcessing } = require("./postProcessing.js");

/**
 * Collect data (from global.datastore) and send to client
 */
const sendData = () => {
  verbose("socket", "sendData");
  const data = global.datastore.getDataForClient();
  if (data === false) {
    global.io.emit("infoMessage", `No data yet`);
    return;
  }
  /* find time of last data point */
  if (data.combinedData.temporal.length) {
      const t = data.combinedData.temporal[data.combinedData.temporal.length-1].time;
      global.io.emit("infoMessage", `new data (t=${t}s)`);
  }
  global.io.emit('data', data);
};

global.NOTIFY_CLIENT_DATA_UPDATED = () => sendData();

/**
 * Send config over the socket
 */
const sendConfig = () => {
  verbose("socket", "sendConfig");
  global.io.emit("infoMessage", `New config`);
  global.io.emit("config", global.config);
};

global.CONFIG_UPDATED = () => sendConfig();


/**
 * Client has just connected -- send current state of config + data
 */
const initialConnection = (socket) => {
  verbose("socket", "initial connection")
  sendConfig();
  sendData();
};

const setUpIOListeners = (socket) => {
    verbose("socket", "setUpIOListeners (socket for client - server communication)");

    socket.on('config', (clientOptions) => {
        const dataRecalcNeeded = modifyConfig(clientOptions);
        sendConfig();
        if (dataRecalcNeeded) {
            warn("DATA RECALC NOT YET IMPLEMENTED")
        }
    })

    socket.on('triggerPostProcessing', triggerPostProcessing);

  // TODO -- RAMPART no longer processes these requests, although some should be reincorporated
//   socket.on('config', (newConfig) => {
//     try {
//         modifyConfig(newConfig);
//         global.datastore.reprocessAllDatapoints();
//     } catch (err) {
//       console.log(err.message);
//       warn("setting of new config FAILED");
//       return;
//     }
//     sendData(); /* as the barcode -> names may have changed */
//     sendConfig();
//   });

//   socket.on("saveDemuxedReads", (data) => {
//     try {
//       saveFastq({sampleName: data.sampleName, outputDirectory: data.outputDirectory, filters: data.filters});
//     } catch (err) {
//       console.trace(err);
//       warn(`Error during [saveDemuxedReads]`);
//       global.io.emit("showWarningMessage", `Error during [saveDemuxedReads]`);
//     }
//   });

};

module.exports = {
  initialConnection,
  setUpIOListeners
};

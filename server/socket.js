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

const { verbose } = require("./utils");
const { modifyConfig } = require("./config");
const { triggerPostProcessing } = require("./postProcessing.js");
const { sendCurrentPipelineStatuses } = require("./PipelineRunner")
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
      global.io.emit("infoMessage", `new data (t=${t}s, ${data.combinedData.mappedCount} mapped, ${data.combinedData.processedCount} processed)`);
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
 * Send a message to the client from a pipeline runner.
 * Abstracted into a function here rather than having
 * the pipeline runner access global.io directly
 */
const sendMessageFromPipeline = (msg) => {
    global.io.emit("pipeline", msg);
}

/**
 * The only reason this is a global (like `global.CONFIG_UPDATED`)
 * is due to node struggling with circular dependencies. This can
 * (and should) be fixed by reorganising aspects of the code
 */
global.sendMessageFromPipeline = sendMessageFromPipeline;


/**
 * Client has just connected -- send current state of config + data
 */
const initialConnection = (socket) => {
  verbose("socket", "initial connection");
  sendConfig();
  sendData();
  sendCurrentPipelineStatuses();
};

/** When a client connects then set up listeners so that the server can react
 *  to commands from the client
 */
const setUpIOListeners = (socket) => {
    verbose("socket", "setUpIOListeners (socket for client - server communication)");
    socket.on('config', (clientOptions) => modifyConfig(clientOptions));
    socket.on('triggerPostProcessing', triggerPostProcessing);
};

module.exports = {
  initialConnection,
  setUpIOListeners
};

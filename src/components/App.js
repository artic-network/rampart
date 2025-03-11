/*
 * Copyright (c) 2019-2025 ARTIC Network http://artic.network
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

import React, { Component } from 'react';
import Renderer from './Renderer';
import io from 'socket.io-client';
import WindowMonitor from './WindowMonitor';

export const TimerContext = React.createContext();

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      /* `mainPage` acts as a switch to choose what page will be shown */
      mainPage: "loading",
      /* `warningMessage`, if set, will show in a modal until cleared */
      warningMessage: "",
      /* `config` mirrors that on the server. Modified by a socket call from the server */
      config: {},
      /* `socketPort` can be set via the server when we first load the client */
      socketPort: undefined,
      /* `infoMessages` are an array of `[timestamp, message]` of all messages received from the server */
      infoMessages: [[getTimeNow(), "client initialising"]],
      /* `timeSinceLastDataUpdate` An integer number of seconds */
      timeSinceLastDataUpdate: 0
    };
    /**
     * `setConfig(action)` will trigger the server to update its config (which is the "source of truth")
     * and potentially recompute aspects of the data to be visualised. The client will be notified
     * of such updates via socket signals (see `registerServerListeners` below).
     */
    this.state.setConfig = (action) => this.state.socket.emit('config', action);
    this.state.changePage = (page) => this.setState({mainPage: page});
    this.state.clearWarningMessage = () => this.setState({warningMessage: ""});
  }

  componentDidMount() {
    /* get the socket port to open */
    if (process.env.NODE_ENV === "development") {
      console.log("Dev mode -- socket opening on 3001. This is hardcoded & cannot be changed");
      this.setState({socketPort: 3001})
    } else {
      const apiAddress = `${window.location.origin}/getSocketPort`;
      console.log(`Querying rampart.js server @ ${apiAddress} for what port to open socket on...`);
      fetch(apiAddress)
        .then((res) => {
          console.log(res);
          return res.json()
        })
        .then((res) => {
          console.log("RES", res);
          this.setState({socketPort: res.socketPort})
        })
    }
    window.setInterval(
      () => {this.setState({timeSinceLastDataUpdate: this.state.timeSinceLastDataUpdate+1})},
      1000 /* won't be exactly 1s but close enough & reset every time data arrives */
    );
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.socketPort && this.state.socketPort) {
      console.log(`Opening socket on ${this.state.socketPort} & registering listeners`);
      const socket = io(`${window.location.protocol}//${window.location.hostname}:${this.state.socketPort}`);
      this.registerServerListeners(socket);
      this.setState({socket});
    }
  }

  registerServerListeners(socket) {
    // socket.on("noBasecalledPath", () => {
    //   console.log("noBasecalledPath");
    //   this.setState({mainPage: "chooseBasecalledDirectory"});
    // });
    socket.on("infoMessage", (infoMessage) => {
      const infoMessages = [...this.state.infoMessages];
      infoMessages.push([getTimeNow(), infoMessage]);
      this.setState({infoMessages});
    });
    socket.on("data", (response) => {
      console.log("App got new data", response);
      const { dataPerSample, combinedData} = response;
      this.setState({
        dataPerSample,
        combinedData,
        mainPage: "viz",
        timeSinceLastDataUpdate: 0
      });
    });
    socket.on("config", (newConfig) => {
      console.log("App got new config:", newConfig);
      this.setState({config: newConfig});
    });
    socket.on("showWarningMessage", (warningMessage) => {
        this.setState({warningMessage});
    });
  }

  render() {
    if (!this.state.socket) return null; /* hold off until this is open (opens in <1s) */
    return (
      <WindowMonitor>
        <TimerContext.Provider value={this.state.timeSinceLastDataUpdate}>
          <Renderer {...this.state}/>
        </TimerContext.Provider>
      </WindowMonitor>
    );
  }
}

function getTimeNow() {
  return String(new Date()).split(/\s/)[4];
}

export default App;

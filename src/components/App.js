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

import React, { Component } from 'react';
import Renderer from './Renderer';
import io from 'socket.io-client';
import WindowMonitor from './WindowMonitor';
import { createSampleColours, createReferenceColours } from "../utils/colours";

class App extends Component {
  constructor(props) {
    super(props);
    this.intervalRefInitialData = undefined;
    this.state = {
      mainPage: "loading",
      warningMessage: "",
      viewOptions: {
        sampleColours: {},
      },
      config: {},
      changePage: (page) => this.setState({mainPage: page}),
      socketPort: undefined,
      infoMessage: "",
      timeSinceLastDataUpdate: 0 /* INT seconds */
    };
    /* define state setters -- note that it's ok to modify this.state in the constructor */
    this.state.setViewOptions = (newOptions) => {
      this.setState({viewOptions: Object.assign({}, this.state.viewOptions, newOptions)})
    }
    this.state.setConfig = (opts) => {
      /* the ultimate source of truth for the config resides is the server. A request (by the client)
      to set the config results in a socket call. The server will then return the new config
      (see `registerServerListeners` below) potentially with an updated set of data */
      this.state.socket.emit('config', opts);
    }
    this.state.clearWarningMessage = () => {
      this.setState({warningMessage: ""})
    }
  }

  componentDidMount() {
    /* get the socket port to open */
    if (process.env.NODE_ENV === "development") {
      console.log("Dev mode -- socket opening on 3001. This is hardcoded & cannot be changed")
      this.setState({socketPort: 3001})
    } else {
      const apiAddress = `http://localhost:${window.location.port}/getSocketPort`;
      console.log(`Querying rampart.js server @ ${apiAddress} for what port to open socket on...`)
      fetch(apiAddress)
        .then((res) => {
          console.log(res)
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
      console.log(`Opening socket on ${this.state.socketPort} & registering listeners`)
      const socket = io(`http://localhost:${this.state.socketPort}`);
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
      this.setState({infoMessage});
    })
    socket.on("data", (response) => {
      console.log("App got new data", response);
      const { dataPerSample, combinedData, viewOptions} = response;
      /* if new sample names have been seen, then we need to create colours for them without destroying already-set colours */
      const newViewOptions = Object.assign({}, this.state.viewOptions, viewOptions);
      const samplesInData = Object.keys(dataPerSample);
      const currentSamples = Object.keys(this.state.viewOptions.sampleColours);
      const newSamples = samplesInData.filter((name) => !currentSamples.includes(name));
      const newColours = createSampleColours(currentSamples.length + newSamples.length)
        .slice(currentSamples.length);
      newViewOptions.sampleColours = {};
      currentSamples.filter((name) => samplesInData.includes(name)).forEach((name) => {
        newViewOptions.sampleColours[name] = this.state.viewOptions.sampleColours[name];
      })
      newSamples.forEach((name, idx) => {
        newViewOptions.sampleColours[name] = newColours[idx];
      })
      if (newSamples.includes("unassigned")) {
        newViewOptions.sampleColours.unassigned = "#979797";
      }

      this.setState({
        viewOptions: newViewOptions,
        dataPerSample,
        combinedData,
        mainPage: "viz",
        timeSinceLastDataUpdate: 0
      });
    })
    socket.on("config", (newConfig) => {
      console.log("App got new config:", newConfig);
      this.setState({config: newConfig});
    })

    socket.on("showWarningMessage", (warningMessage) => this.setState({warningMessage}));
  }

  render() {
    const props = {...this.state};
    return (
      <WindowMonitor>
        <Renderer {...props}/>
      </WindowMonitor>
    );
  }
}


export default App;

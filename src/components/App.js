import React, { Component } from 'react';
import Renderer from './Renderer';
import io from 'socket.io-client';
import { createSampleColours, createReferenceColours } from "../utils/colours";

class App extends Component {
  constructor(props) {
    super(props);
    this.intervalRefInitialData = undefined;
    this.state = {
      mainPage: "loading",
      warningMessage: "",
      viewOptions: {
        logYAxis: false,
        sampleColours: {},
        referenceColours: {}
      },
      config: {},
      changePage: (page) => this.setState({mainPage: page})
    };
    /* define state setters -- note that it's ok to modify this.state in the constructor */
    this.state.setViewOptions = (newOptions) => {
      this.setState({viewOptions: Object.assign({}, this.state.viewOptions, newOptions)})
    }
    this.state.setConfig = (newConfig) => {
      this.setState({config: newConfig});
    }
    this.state.clearWarningMessage = () => {
      this.setState({warningMessage: ""})
    }
    /* since this component's state contains most of the data used throughout the client,
    it is the main point to receive & store data sent from the server */
    this.state.socket = io('http://localhost:3002');
    this.registerServerListeners(this.state.socket);
  }

  registerServerListeners(socket) {
    socket.on("noBasecalledPath", () => {
      console.log("noBasecalledPath");
      this.setState({mainPage: "chooseBasecalledDirectory"});
    });
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
      if (newSamples.includes("noBarcode")) {
        newViewOptions.sampleColours.noBarcode = "#979797";
      }

      this.setState({
        viewOptions: newViewOptions,
        dataPerSample,
        combinedData,
        mainPage: "viz"
      });
    })
    socket.on("config", (newConfig) => {
      console.log("App got new config:", newConfig);
      /* certain changes to the config may necessitate an updating of viewOptions */
      const newViewOptions = {};
      /* the first time we see the reference panel create the colours */
      if (!this.state.config.referencePanel && newConfig.referencePanel) {
        const colours = createReferenceColours(newConfig.referencePanel.length);
        newViewOptions.referenceColours = {};
        newConfig.referencePanel.forEach((ref, idx) => {
          newViewOptions.referenceColours[ref.name] = colours[idx];
        })
      }
      const newState = {config: newConfig};
      if (Object.keys(newViewOptions)) {
        newState.viewOptions = Object.assign({}, this.state.viewOptions, newViewOptions);
      }
      this.setState(newState);
    })

    socket.on("showWarningMessage", (warningMessage) => this.setState({warningMessage}));
  }

  render() {
    const props = {...this.state};
    return (
      <Renderer {...props}/>
    );
  }
}


export default App;

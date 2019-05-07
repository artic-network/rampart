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
      console.log("DATA:", response);
      const newViewOptions = Object.assign({}, this.state.viewOptions, response.settings);
      if (Object.keys(newViewOptions.sampleColours).length !== Object.keys(response.data)) {
        const names = Object.keys(response.data);
        const colours = createSampleColours(names.length);
        newViewOptions.sampleColours = {};
        names.forEach((n, i) => {newViewOptions.sampleColours[n]=colours[i]});
      }
      console.log("newViewOptions ->", newViewOptions)
      this.setState({viewOptions: newViewOptions, data: response.data, mainPage: "viz"});
    })
    socket.on("config", (config) => {
      /* recompute reference colours */
      
      const newViewOptions = Object.assign({}, this.state.viewOptions);
      if (config.referencePanel) {
        const colours = createReferenceColours(config.referencePanel.length);
        console.log(colours)
        newViewOptions.referenceColours = {};
        config.referencePanel.forEach((ref, idx) => {
          newViewOptions.referenceColours[ref.name] = colours[idx];
        })
      }
  
      this.setState({config, viewOptions: newViewOptions});
      console.log("CONFIG:", config);
    })
  }

  render() {
    const props = {...this.state};
    return (
      <Renderer {...props}/>
    );
  }
}


export default App;

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
    };
    this.setViewOptions = (newOptions) => {
      this.setState({viewOptions: Object.assign({}, this.state.viewOptions, newOptions)})
    }
    this.state.setConfig = (newConfig) => {
      this.setState({config: newConfig});
    }

    this.state.socket = io('http://localhost:3002');
    this.state.socket.on("noBasecalledDir", () => {
      console.log("noBasecalledDir");
      this.setState({mainPage: "chooseBasecalledDirectory"});
    });
    this.state.socket.on("data", (response) => {
      console.log("DATA:", response);
      const viewOptions = Object.assign({}, this.state.viewOptions, response.settings);
      if (Object.keys(this.state.viewOptions.sampleColours).length !== Object.keys(response.data)) {
        const names = Object.keys(response.data);
        const colours = createSampleColours(names.length);
        viewOptions.sampleColours = {};
        names.forEach((n, i) => {viewOptions.sampleColours[n]=colours[i]});
      }
      console.log(viewOptions)
      this.setState({viewOptions, data: response.data, mainPage: "viz"});
    })
    this.state.socket.on("config", (config) => {
      /* recompute reference colours */
      const viewOptions = Object.assign({}, this.state.viewOptions);
      if (config.referencePanel) {
        const colours = createReferenceColours(config.referencePanel.length);
        console.log(colours)
        viewOptions.referenceColours = {};
        config.referencePanel.forEach((ref, idx) => {
          viewOptions.referenceColours[ref.name] = colours[idx];
        })
      }

      this.setState({config, viewOptions});
      console.log("CONFIG:", config);
    })

  }

  render() {
    const props = {setViewOptions: this.setViewOptions, ...this.state};
    return (
      <Renderer {...props}/>
    );
  }
}


export default App;

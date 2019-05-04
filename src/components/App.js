import React, { Component } from 'react';
import Renderer from './Renderer';
import io from 'socket.io-client';

class App extends Component {
  constructor(props) {
    super(props);
    this.intervalRefInitialData = undefined;
    this.state = {
      mainPage: "loading",
      viewOptions: {
        logYAxis: false
      },
      config: {}
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
    this.state.socket.on("data", (data) => {
      console.log("DATA:", data);
      this.setState({data, mainPage: "viz"});
    })
    this.state.socket.on("config", (config) => {
      this.setState({config});
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

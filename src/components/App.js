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
      },
      config: {},
      changePage: (page) => this.setState({mainPage: page}),
      socketPort: undefined,
      infoMessage: ""
    };
    /* define state setters -- note that it's ok to modify this.state in the constructor */
    this.state.setViewOptions = (newOptions) => {
      this.setState({viewOptions: Object.assign({}, this.state.viewOptions, newOptions)})
    }
    this.state.setConfig = ({config, refFasta, refJsonPath, refJsonString}) => {
      this.state.socket.emit('config', {config, refFasta, refJsonPath, refJsonString});
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
        mainPage: "viz"
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
      <Renderer {...props}/>
    );
  }
}


export default App;

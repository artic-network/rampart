import React, { Component } from 'react';
import { queryServerForRunConfig, requestReads } from "../utils/getData"
import Renderer from './Renderer';
import io from 'socket.io-client';


const timeBetweenUpdates = 2000;

// /* config reducer */
// const configReducer = (state, action) => {
//   switch (action.type) {
//     case 'NEW':
//       return action.config;
//     case 'UPDATE':
//       return Object.assign({}, state, action.data);
//     case 'BARCODE_NAME':
//       const barcodeToName = state.barcodeToName;
//       barcodeToName[action.barcode] = action.name;
//       return Object.assign({}, state, {barcodeToName});
//     default:
//       throw new Error();
//   }
// };


class App extends Component {
  constructor(props) {
    super(props);
    this.intervalRefInitialData = undefined;
    this.state = {
      status: "App Loading",
      mainPage: "loading",
      viewOptions: {
        logYAxis: false
      }
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



// const App = () => {
//   const socketRef = useRef();
//   const [data, setData] = useState(undefined);
//   const [mainPage, setMainPage] = useState("loading");
//   const [config, configDispatch] = useReducer(configReducer, undefined);

//   useEffect(
//     () => {
//       console.log("Connecting to socket.io")
//       const socket = io('http://localhost:3002');
//       socket.on("noBasecalledDir", () => {
//         console.log("noBasecalledDir");
//         setMainPage("chooseBasecalledDirectory");
//       });
//       socket.on("data", (data) => {
//         console.log(data);
//         setMainPage("viz");
//         setData(data);
//       })
//       socket.on("config", (config) => {
//         configDispatch({type: "NEW", config});
//       })

//       return () => {
//         console.log("TO DO - close socket if needed");
//       };
//     },
//     []
//   );

//   return (
//     <Renderer data={data} mainPage={mainPage} config={config} configDispatch={configDispatch}/>
//   );

// }

export default App;

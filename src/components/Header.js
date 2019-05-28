import React from 'react';
import PropTypes from "prop-types";
import logo from "../images/logo.png";
import { makeTimeFormatter } from "../utils/commonFunctions";

class Header extends React.Component {
  constructor(props) {
    super(props);
    this.handleKeyDown = (event) => {
      switch(event.keyCode) {
        case 76: // key: "l"
          this.props.setViewOptions({logYAxis: !this.props.viewOptions.logYAxis});
          break;
        default:
          break;
      }
    }
    this.state = {infoMessage: ""};
    this.props.socket.on("infoMessage", (infoMessage) => {
      this.setState({infoMessage});
    })
  }
  componentWillMount() {
      document.addEventListener("keydown", this.handleKeyDown);
  }
  renderButtons() {
    return this.props.sidebarButtonNames.map(({label, value}) => {
      return (
        <button className="modernButton" onClick={() => this.props.sidebarOpenCB(value)} key={value}>
          {label}
        </button>
      )
    })
  }
  renderInfo() {
    // const runTime = //this.props.runTime
    // let runTimeMsg = `Run time: ${makeTimeFormatter()(runTime)}`;
    // const tSinceLastUpdate = (new Date()) - this.props.timeLastReadsReceived;
    // if (tSinceLastUpdate > 10) {
    //   runTimeMsg += ` (last updated ${makeTimeFormatter()(tSinceLastUpdate)} ago)`;
    // }
    // if (!runTime) {
    //   return (
    //     <div>
    //       <h2 style={{margin: "2px"}}>{this.props.name}</h2>
    //       <h3 style={{margin: "2px"}}>{`Awaiting reads...`}</h3>
    //     </div>
    //   )
    // }

    const readsMsg = this.props.combinedData ? `${this.props.combinedData.demuxedCount} reads demuxed, ${this.props.combinedData.mappedCount} reads mapped.` : "No data yet";
    return (
      <div>
        <h2 style={{margin: "2px"}}>{this.props.config.title}</h2>
        <h3 style={{margin: "2px"}}>{readsMsg}</h3>
        <h3 style={{margin: "2px"}}>{`Last server message: ${this.state.infoMessage}`}</h3>

        {/* <h3 style={{margin: "2px"}}>{runTimeMsg}</h3> */}
        {/* <h3 style={{margin: "2px"}}>{`${this.props.numReads} reads, ${this.props.nFastqs} fastqs, ${this.props.numSamples} samples`}</h3> */}
      </div>
    )
  }
  render() {
    return (
      <div className="header">

        <div className="logo">
          <a href="http://artic.network" target="_blank" rel="noopener noreferrer">
            <img src={logo} alt={"logo"} width="132"/>
          </a>
        </div>

        <div>
          <h2 style={{marginTop: "0px", marginBottom: "8px"}}>
            <span style={{fontSize: "1.8em"}}>RAMPART</span>
            <span> Read Assignment, Mapping, and Phylogenetic Analysis in Real Time</span>
          </h2>
          {this.renderInfo()}
        </div>

        <div className="buttons">
          {this.renderButtons()}
        </div>

      </div>
    )

  }
}

Header.propTypes = {
  setViewOptions: PropTypes.func.isRequired,
  sidebarButtonNames: PropTypes.array.isRequired,
  sidebarOpenCB: PropTypes.func.isRequired,
  config: PropTypes.object,
  combinedData: PropTypes.object
};

Header.defaultProps = {
  config: {title: "Config not set!"},
}

export default Header;

import React from 'react';
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
  }
  componentWillMount() {
      document.addEventListener("keydown", this.handleKeyDown);
  }
  renderButtons() {
    return this.props.sidebarButtonNames.map((name) => {
      return (
        <button className="modernButton" onClick={() => this.props.sidebarOpenCB(name)}>
          {name}
        </button>
      )
    })
  }
  renderStats() {
    const runTime = this.props.runTime
    let runTimeMsg = `Run time: ${makeTimeFormatter()(runTime)}`;
    const tSinceLastUpdate = (new Date()) - this.props.timeLastReadsReceived;
    if (tSinceLastUpdate > 10) {
      runTimeMsg += ` (last updated ${makeTimeFormatter()(tSinceLastUpdate)} ago)`;
    }
    if (!runTime) {
      return (
        <div>
          <h2 style={{margin: "2px"}}>{this.props.name}</h2>
          <h3 style={{margin: "2px"}}>{`Awaiting reads...`}</h3>
        </div>
      )
    }
    return (
      <div>
        <h2 style={{margin: "2px"}}>{this.props.name}</h2>
        <h3 style={{margin: "2px"}}>{runTimeMsg}</h3>
        <h3 style={{margin: "2px"}}>{`${this.props.numReads} reads, ${this.props.nFastqs} fastqs, ${this.props.numSamples} samples`}</h3>
      </div>
    )
  }
  renderStatus() {
    return (
      <h2 style={{margin: "2px"}}>{`Server status: ${this.props.status}`}</h2>
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
            <span>Read Assignment, Mapping, and Phylogenetic Analysis in Real Time</span>
          </h2>
          {this.props.name ? this.renderStats() : this.renderStatus()}
        </div>


        <div className="buttons">
          {this.renderButtons()}
        </div>

      </div>
    )

  }
}

export default Header;

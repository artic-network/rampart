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

import React from 'react';
import PropTypes from "prop-types";
import logo from "../images/logo.png";
import { makeTimeFormatter } from "../utils/commonFunctions";
import { getLogYAxis } from "../utils/config";

class Header extends React.Component {
  constructor(props) {
    super(props);
    this.handleKeyDown = (event) => {
      switch(event.keyCode) {
        case 76: // key: "l"
          this.props.setConfig({logYAxis: !getLogYAxis(this.props.config)});
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

    const readsMsg = this.props.combinedData ? `${this.props.combinedData.mappedCount} reads mapped ` : "no data yet ";
    const rateMsg = this.props.combinedData && this.props.combinedData.mappedRate >= 0 ?
        `${Math.round(this.props.combinedData.mappedRate)} reads/sec` : "calculating rate...";
    const title = this.props.config.run ? `${this.props.config.run.title}` : "untitled";
    return (
      <div>
        <h3 style={{margin: "2px", fontWeight: "normal"}}>{`Experiment: ${title} | ${readsMsg} | ${rateMsg}`}</h3>
        <h3 style={{margin: "2px", fontSize:"0.9em", fontWeight: "bold"}}>{`Last server message: ${this.props.infoMessage}`}</h3>

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
            <img src={logo} alt={"logo"} width="96"/>
          </a>
        </div>

        <div className="title">
          <h2 style={{marginTop: "0px", marginBottom: "8px"}}>
            <span style={{fontSize: "1.8em", fontWeight: "normal"}}>RAMPART</span>
            <span style={{fontWeight: "100"}}> Read Assignment, Mapping, and Phylogenetic Analysis in Real Time</span>
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
  combinedData: PropTypes.object,
  infoMessage: PropTypes.string.isRequired
};

Header.defaultProps = {
  config: {title: "Config not set!"},
};

export default Header;

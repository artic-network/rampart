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
import logo from "../../images/logo.png";
import {getLogYAxis, getRelativeReferenceMapping} from "../../utils/config";
import MessageLog from "./MessageLog";
import { TimerContext } from "../App";
import RunSummary from "./RunSummary";


class Header extends React.Component {
  constructor(props) {
    super(props);
    this.handleKeyDown = (event) => {
      switch(event.keyCode) {
        case 76: // key: "l"
          this.props.setConfig({logYAxis: !getLogYAxis(this.props.config)});
          break;
        case 82: // key: "r"
          this.props.setConfig({relativeReferenceMapping: !getRelativeReferenceMapping(this.props.config)});
          break;
        default:
          break;
      }
    }
  }
  UNSAFE_componentWillMount() {
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

          <h3>{`Experiment: ${this.props.config.run ? `${this.props.config.run.title}` : "untitled"}`}</h3>
          <TimerContext.Consumer>
            {(timeSinceLastDataUpdate) => (
              <RunSummary timeSinceLastDataUpdate={timeSinceLastDataUpdate} combinedData={this.props.combinedData}/>
            )}
          </TimerContext.Consumer>
          <MessageLog messages={this.props.infoMessages}/>

        </div>

        <div className="buttons">
          {this.renderButtons()}
        </div>

      </div>
    )

  }
}

Header.propTypes = {
  sidebarButtonNames: PropTypes.array.isRequired,
  sidebarOpenCB: PropTypes.func.isRequired,
  config: PropTypes.object,
  combinedData: PropTypes.object,
  infoMessages: PropTypes.array.isRequired
};

Header.defaultProps = {
  config: {title: "Config not set!"},
};

export default Header;

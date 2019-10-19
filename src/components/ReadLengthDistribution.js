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
import { select } from "d3-selection";
import {calcScales, drawAxes} from "../utils/commonFunctions";
import {drawSteps} from "../d3/drawSteps";
import { max } from "d3-array";
import { getLogYAxis } from "../utils/config";

/* given the DOM dimensions of the chart container, calculate the chart geometry (used by the SVG & D3) */
const calcChartGeom = (DOMRect) => ({
  width: DOMRect.width,
  height: DOMRect.height - 20, // title line
  spaceLeft: 60,
  spaceRight: 10,
  spaceBottom: 70,
  spaceTop: 20
});

class ReadLengthDistribution extends React.Component {
  constructor(props) {
    super(props);
    this.state = {chartGeom: {}};
  }
  redraw() {
    if (!this.props.xyValues.length) return;
    const maxX = this.props.xyValues[this.props.xyValues.length-1][0];
    const maxY = max(this.props.xyValues.map((xy) => xy[1]));
    const scales = calcScales(this.state.chartGeom, maxX, maxY, getLogYAxis(this.props.config));
    drawAxes(this.state.svg, this.state.chartGeom, scales, {xSuffix: "bp", xTicks: 4})
    const data = [{name: "Read Lengths", xyValues: this.props.xyValues, colour: this.props.colour}];
    const hoverDisplayFunc = ({name, xValue, yValue}) => (`Read length ${xValue}bp<br/>Num reads: ${yValue}`);
    drawSteps({svg: this.state.svg, chartGeom: this.state.chartGeom, scales, data, fillBelowLine: true, hoverSelection: this.state.hoverSelection, hoverDisplayFunc});
  }
  componentDidMount() {
    const svg = select(this.DOMref);
    const hoverSelection = select(this.infoRef);
    const chartGeom = calcChartGeom(this.boundingDOMref.getBoundingClientRect());
    const hoverWidth = parseInt(chartGeom.width * 1/2, 10);
    this.setState({svg, chartGeom, hoverSelection, hoverWidth});
  }
  componentDidUpdate(prevProps) {
    this.redraw();
  }
  render() {
    return (
      <div className={this.props.className} style={{width: this.props.width}} ref={(r) => {this.boundingDOMref = r}}>
        <div className="chartTitle">
          {this.props.title}
        </div>
        <div className="hoverInfo" style={{maxWidth: this.state.hoverWidth}} ref={(r) => {this.infoRef = r}}/>
        <svg
          ref={(r) => {this.DOMref = r}}
          height={this.state.chartGeom.height || 0}
          width={this.state.chartGeom.width || 0}
        />
        {this.props.renderProp ? this.props.renderProp : null}
      </div>
    )
  }
}

export default ReadLengthDistribution;

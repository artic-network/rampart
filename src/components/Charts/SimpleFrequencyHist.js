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
import {calcXScale, calcYScale, drawAxes} from "../../utils/commonFunctions";
import { drawSteps } from "../../d3/drawSteps";
import { getLogYAxis } from "../../utils/config";
import Container, {Title, HoverInfoBox} from "./styles";

/* given the DOM dimensions of the chart container, calculate the chart geometry (used by the SVG & D3) */
const calcChartGeom = (DOMRect) => ({
    width: DOMRect.width,
    // height: 350, // title line
    height: DOMRect.height - 20, // title line
    spaceLeft: 60,
    spaceRight: 0,
    spaceBottom: 70,
    spaceTop: 10
});

const getMaxFrequency = (data, attrName) => {
    const allFreqs = Object.keys(data).map((name) => data[name][attrName]).flat();
    return Math.max(...allFreqs);
};

const getMaxBin = (data, attrName, scaleFactor = null) => {
    const nonZeroBins = [];
    Object.keys(data).map(
        name => data[name][attrName].forEach(
            (count, index) => {
                if (count > 0) {
                    nonZeroBins.push(index)
                }
            })
    );
    const max = Math.max(...nonZeroBins);
    return scaleFactor ? scaleFactor * max : max;
};

class SimpleFrequencyHist extends React.Component {
    constructor(props) {
        super(props);
        this.state = {chartGeom: {}, logScale: false};
    }

    redraw () {
        const data = Object.keys(this.props.data)
            .filter((name) => name!=="all")
            .map((name) => ({
                name,
                xyValues: this.props.data[name][this.props.attrName].map((cov, idx) => [this.props.scaleFactor ? idx * this.props.scaleFactor : idx, cov]),
                colour: this.props.sampleColours[name] || "#FFFFFF"
            }));

        this.state.svg.selectAll("*").remove();

        const xScale = calcXScale(this.state.chartGeom, getMaxBin(this.props.data, this.props.attrName, this.props.scaleFactor));
        const yScale = calcYScale(this.state.chartGeom, getMaxFrequency(this.props.data, this.props.attrName), {log: getLogYAxis(this.props.config)});
        const scales = {x: xScale, y: yScale};

        const hoverDisplayFunc = ({name, xValue, yValue}) => (`Sample: ${name}<br/>${this.props.xLabel}: ${xValue}<br/>Count: ${Math.round(yValue)}`);

        /* draw the axes */
        drawAxes(this.state.svg, this.state.chartGeom, scales);
        // drawAxes(this.state.svg, this.state.chartGeom, scales, {xSuffix: "bp", ySuffix});

        drawSteps({
            svg: this.state.svg,
            chartGeom: this.state.chartGeom,
            scales,
            data,
            fillBelowLine: !!this.props.fillIn,
            hoverSelection: this.state.hoverSelection,
            hoverDisplayFunc
        });
    }

    componentDidMount() {
        const svg = select(this.DOMref);
        const chartGeom = calcChartGeom(this.boundingDOMref.getBoundingClientRect());
        const hoverWidth = parseInt(chartGeom.width * 3/4, 10);
        const hoverSelection = select(this.infoRef);
        this.setState({svg, chartGeom, hoverWidth, hoverSelection});
    }

    componentDidUpdate() {
      this.redraw();
    }

    render() {
        return (
            <Container width={this.props.width} ref={(r) => {this.boundingDOMref = r}}>
                <Title>{this.props.title}</Title>
                <HoverInfoBox width={this.state.hoverWidth || 0} ref={(r) => {this.infoRef = r}}/>
                <svg
                    ref={(r) => {this.DOMref = r}}
                    height={this.state.chartGeom.height || 0}
                    width={this.state.chartGeom.width || 0}
                />
                {this.props.renderProp ? this.props.renderProp : null}
            </Container>
        )
    }
}

export default SimpleFrequencyHist;

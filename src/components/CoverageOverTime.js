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
import { line, curveBasis } from "d3-shape";
import {calcXScale, calcYScale, drawAxes} from "../utils/commonFunctions";
import {color as d3color} from "d3-color";

/* given the DOM dimensions of the chart container, calculate the chart geometry (used by the SVG & D3) */
const calcChartGeom = (DOMRect) => ({
    width: DOMRect.width,
    height: DOMRect.height - 20, // title line
    spaceLeft: 50,
    spaceRight: 10,
    spaceBottom: 70,
    spaceTop: 20
});

const strokeDashFunction = (coverage, i) => { /* i = 0, 1, 2 or 3 */
    if (coverage === 0) {
        return "1.5 3";
    }
    if (i > 1) {
        return "2, 8";
    } else if (i === 1) {
        return "5";
    }
    return "0";
};

const drawProgressLines = (svg, scales, data, colour, coverageThresholds) => {
    svg.selectAll(".coverageLine").remove();
    svg.selectAll(".coverageLine")
        .data(Object.keys(coverageThresholds))
        .enter().append("path")
        .attr("class", "coverageLine")
        .attr("fill", "none")
        .attr("stroke", colour)
        .attr("stroke-width", (key) => (coverageThresholds[key] === 0 ? 1.5: 3) )
        .attr("stroke-linecap", "round")
        .style("stroke-dasharray", (key, i) => strokeDashFunction(coverageThresholds[key], i))
        .attr('d', (key) => {
            const generator = line()
                .x((d) => scales.x(d.time)) // d here is the individual time point, {time: ..., over100x: ...}
                .y((d) => scales.y(d.coverages[key]))
                .curve(curveBasis);
            return generator(data);
        });
};

const drawMaxLines = (svg, scales, data, colour, coverageThresholds) => {

    const timespan = [data[0].time, data[data.length-1].time];

    /* only want to display labels over 10% else they are too visually cluttered with the x axis */
    const thresholds = Object.keys(coverageThresholds)
        .map((l, i) => ({key: l, coverage: data[data.length - 1].coverages[l], originalIdx: i}))
        .filter((o, i) => coverageThresholds[o.key] === 0 || o.coverage > 5.0);

    svg.selectAll(".maxCoverageLine").remove();
    svg.selectAll(".maxCoverageLine")
        .data(thresholds)
        .enter().append("path")
        .attr("class", "maxCoverageLine")
        .attr("fill", "none")
        .attr("stroke", colour)
        .attr("stroke-width", 1)
        .attr('d', (d) =>
            `M ${scales.x(timespan[0])},${scales.y(d.coverage)} L ${scales.x(timespan[1])},${scales.y(d.coverage)}`
        );

    svg.selectAll(".maxCoverageText").remove();
    svg.selectAll(".maxCoverageText")
        .data(thresholds)
        .enter().append("text")
        .attr("class", "maxCoverageText axis")
        .attr("x", (d) =>
            scales.x(d.originalIdx === 0 ? timespan[0] : (d.originalIdx >= 2 ? timespan[1] : ((timespan[1]-timespan[0])/2))) +
            (d.originalIdx === 0 ? 2 : 0) // add a little bit of space on the left.
        )
        .attr("y", (d) => scales.y(d.coverage))
        .attr("dy", "12px") /* positive values bump down text */
        .attr("text-anchor", (d) => d.originalIdx === 0 ? "start" : (d.originalIdx >= 2 ? "end" : "middle"))
        .attr("baseline-shift", "120%") /* i.e. y value specifies top of text */
        .attr("pointer-events", "none") /* don't capture mouse over */
        .text((d) => `${d.key} = ${d.coverage.toFixed(1)}%`);
};

const drawLegend = (svg, chartGeom, colour, coverageThresholds) => {
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${chartGeom.spaceLeft}, ${chartGeom.height - chartGeom.spaceBottom + 30})`);

    const keys = Object.keys(coverageThresholds)
        .filter((o) => coverageThresholds[o] !== 0);

    legend.selectAll("line")
        .data(keys)
        .enter()
        .append("path")
        .attr("d", (d, i) => `M10,${15*i} H50`)
        .attr("stroke-width", 3)
        .attr("stroke", colour)
        .attr("stroke-linecap", "round")
        .style("stroke-dasharray", (key, i) => strokeDashFunction(coverageThresholds[key], i));

    legend.selectAll("line")
        .data(keys)
        .enter()
        .append("text")
        .attr("class", "axis")
        .attr("x", 55)
        .attr("y", (_, i) => 15*i + 4)
        .text((d) => `${d}`);

};

class CoverageOverTime extends React.Component {
    constructor(props) {
        super(props);
        this.state = {chartGeom: {}};
    }
    componentDidMount() {
        const svg = select(this.DOMref);
        const chartGeom = calcChartGeom(this.boundingDOMref.getBoundingClientRect());
        const yScale = calcYScale(chartGeom, 100);
        const colour = d3color(this.props.colour);
        drawLegend(svg, chartGeom, colour, this.props.config.display.coverageThresholds);
        this.setState({svg, chartGeom, yScale, colour});
    }
    componentDidUpdate(prevProps) {
        if (!this.props.temporalData.length) return;
        const finalDataPt = this.props.temporalData[this.props.temporalData.length-1];
        const timeMax = (parseInt(finalDataPt.time/30, 10) +1) * 30;
        const scales = {x: calcXScale(this.state.chartGeom, timeMax), y: this.state.yScale};
        drawAxes(this.state.svg, this.state.chartGeom, scales, {xTicks: 4, yTicks:5, isTime: true, ySuffix: "%"});
        drawProgressLines(this.state.svg, scales, this.props.temporalData, this.state.colour, this.props.config.display.coverageThresholds);
        drawMaxLines(this.state.svg, scales, this.props.temporalData, this.state.colour, this.props.config.display.coverageThresholds);
    }
    render() {
        return (
            <div className={this.props.className} style={{width: this.props.width}} ref={(r) => {this.boundingDOMref = r}}>
                <div className="chartTitle">
                    {this.props.title}
                </div>
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

export default CoverageOverTime;

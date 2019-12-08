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
import { select, mouse } from "d3-selection";
import { line, curveBasis, curveLinear } from "d3-shape";
import {calcScales, drawAxes, makeTimeFormatter, findLineYposGivenXpos} from "../utils/commonFunctions";
import {defaultLineColour} from "../utils/colours";
import { getLogYAxis } from "../utils/config";
import Toggle from "./toggle";

const timeFormatter = makeTimeFormatter();

/* given the DOM dimensions of the chart container, calculate the chart geometry (used by the SVG & D3) */
const calcChartGeom = (DOMRect) => ({
    width: DOMRect.width,
    height: DOMRect.height - 20, // title line
    spaceLeft: 60,
    spaceRight: 0,
    spaceBottom: 70,
    spaceTop: 10
});


const getMaxsOfReadsOverTime = (readsOverTime) => {
    const finalPoint = readsOverTime.slice(-1)[0];

    // const timeMax = (parseInt(finalPoint.time/30, 10) +1) * 30;
    const timeMax = finalPoint.time;

    // const resolution = finalPoint.mappedCount > 10000 ? 10000 :
    //     finalPoint.mappedCount > 1000 ? 1000 :
    //         finalPoint.mappedCount > 100 ? 100 : 10;
    // const readsMax = (parseInt(finalPoint.mappedCount/resolution, 10) +1) * resolution;
    // AR - I don't think the above rounding is required
    const readsMax = finalPoint.mappedCount;

    // the maximum rate is not necessarily to be the last point
    const rateMax = Math.max(...readsOverTime.map(point => (point.mappedRate ? point.mappedRate : 0)));

    return {timeMax, readsMax, rateMax};
};

const drawLine = (svg, scales, data, showRate, infoRef) => {

    // map data to x,y and clip any missing values
    const xyData = data
        .map( d => ({ x: d.time, y: showRate ? (d.mappedRate ? d.mappedRate : -1) : d.mappedCount}))
        .filter( d => d.y >= 0 );

    const lineGenerator = line()
        .x((d) => scales.x(d.x))
        .y((d) => scales.y(d.y))
        .curve(curveBasis);

    function handleMouseMove() {
        const [mouseX, mouseY] = mouse(this); // [x, y] x starts from left, y starts from top
        const left  = mouseX > 0.5 * scales.x.range()[1] ? "" : `${mouseX + 16}px`;
        const right = mouseX > 0.5 * scales.x.range()[1] ? `${scales.x.range()[1] - mouseX}px` : "";
        const value = parseInt(scales.y.invert(findLineYposGivenXpos(mouseX, path.node())), 10);
        select(infoRef)
            .style("left", left)
            .style("right", right)
            .style("top", `${mouseY-35}px`)
            .style("visibility", "visible")
            .html(`
        Time: ${timeFormatter(scales.x.invert(mouseX))}
        <br/>
        ${showRate ? "rate(reads/sec)" : "count(reads)"}: ${value} (interpolated)
      `);
    }
    function handleMouseOut() {
        select(infoRef).style("visibility", "hidden");
    }

    svg.selectAll(".readsLine").remove();
    const path = svg.append("path")
        .attr("class", "readsLine")
        .attr("fill", "none")
        .attr("stroke", defaultLineColour)
        .attr("stroke-width", 3)
        .attr('d', () => (lineGenerator(xyData)))

    /* append a div over the entire graph to catch onHover mouse events */
    svg.selectAll(".mouseRect").remove();
    svg.append("rect")
        .attr("class", "mouseRect")
        .attr("x", `${scales.x.range()[0]}px`)
        .attr("width", `${scales.x.range()[1] - scales.x.range()[0]}px`)
        .attr("y", `${scales.y.range()[1]}px`)
        .attr("height", `${scales.y.range()[0] - scales.y.range()[1]}px`)
        .attr("fill", "rgba(0,0,0,0)")
        .on("mouseout", handleMouseOut)
        .on("mousemove", handleMouseMove);

};

class ReadsOverTime extends React.Component {
    constructor(props) {
        super(props);
        this.state = {chartGeom: {}, showRate: false};
        this.toggleReadsVsRate = () => {
            this.setState({showRate: !this.state.showRate})
        }
    }

    redraw() {
        const { timeMax, readsMax, rateMax } = getMaxsOfReadsOverTime(this.props.temporalData);
        const scales = calcScales(this.state.chartGeom, timeMax, this.state.showRate ? rateMax : readsMax, getLogYAxis(this.props.config));
        const xTicks = this.state.chartGeom.width > 500 ? 5 : this.state.chartGeom.width > 300 ? 3 : 2;
        drawAxes(this.state.svg, this.state.chartGeom, scales, {isTime: true, xTicks})
        drawLine(this.state.svg, scales, this.props.temporalData, this.state.showRate, this.infoRef)
    }

    componentDidMount() {
        const chartGeom = calcChartGeom(this.boundingDOMref.getBoundingClientRect());
        const svg = select(this.DOMref);
        const hoverWidth = parseInt(chartGeom.width * 1/2, 10);
        this.setState({chartGeom, svg, hoverWidth})
    }

    componentDidUpdate() {
        this.redraw();
    }

    render() {
        return (
            <div className={this.props.className} style={{width: this.props.width}} ref={(r) => {this.boundingDOMref = r}}>
                {/*<div className="chartTitle">*/}
                {/*{this.props.title}*/}
                {/*</div>*/}
                <div className="centerHorizontally">
                    <Toggle
                        labelLeft="Mapped reads"
                        labelRight="Reads/sec"
                        handleToggle={this.toggleReadsVsRate}
                        toggleOn={false}
                    />
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

export default ReadsOverTime;

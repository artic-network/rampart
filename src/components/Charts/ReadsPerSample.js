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
import {drawAxes} from "../../utils/commonFunctions";
import {scaleLinear, scaleLog, scaleOrdinal} from "d3-scale";
import { getLogYAxis } from "../../utils/config";
import Container, {Title, HoverInfoBox} from "./styles";

/* given the DOM dimensions of the chart container, calculate the chart geometry (used by the SVG & D3) */
const calcChartGeom = (DOMRect) => ({
  width: DOMRect.width > 500 ? 500 : DOMRect.width,
  height: DOMRect.height, // title line
  spaceLeft: 60,
  spaceRight: 0,
  spaceBottom: 90,
  spaceTop: 10
});

const calculateBarWidth = (chartGeom, numSamples) =>
    ((chartGeom.width - chartGeom.spaceLeft - chartGeom.spaceRight) / numSamples);

const getMaxCount = ({samples, data}) => {
  let maxCount = 0;
  for (const sampleName of samples) {
    if (data[sampleName].mappedCount && data[sampleName].mappedCount > maxCount) maxCount = data[sampleName].mappedCount;
  }
  if (!maxCount) return 0;
  const resolution = maxCount.mappedCount > 10000 ? 10000 :
      maxCount.mappedCount > 1000 ? 1000 :
          maxCount.mappedCount > 100 ? 100 : 10;
  return maxCount ? (parseInt(maxCount/resolution, 10)+1)*resolution : 0;
};

const calcXScale = (chartGeom, barWidth, numSamples) => {
  const xValues = Array.from(new Array(numSamples), (_, i) => i);
  return scaleOrdinal()
      .domain(xValues)
      .range(xValues.map(x => (x+0.5)*barWidth + chartGeom.spaceLeft))
};

const calcYScale = (chartGeom, maxReads, log) => {
  if (log) {
    return scaleLog()
        .base(10)
        .domain([10, maxReads])
        .range([chartGeom.height - chartGeom.spaceBottom, chartGeom.spaceTop])
        .clamp(true);
  }
  return scaleLinear()
      .domain([0, maxReads])
      .range([chartGeom.height - chartGeom.spaceBottom, chartGeom.spaceTop]);
};


const drawColumns = (svg, chartGeom, scales, counts, barWidth, colours, samples, infoRef, data, goToSamplePanel) => {
  function handleMouseMove(d, i) {
    /* NOTE - we're using an ordinal scale so things are a little different here */
    const [mouseX, mouseY] = mouse(this); // [x, y] x starts from left, y starts from top
    const _xRange = scales.x.range();
    const rangeLeftRightPx = [_xRange[0] - barWidth/2, _xRange[_xRange.length-1] + barWidth/2];
    const midPosPx = rangeLeftRightPx[0] + (rangeLeftRightPx[1] - rangeLeftRightPx[0])/2
    const left  = mouseX > midPosPx ? "" : `${mouseX + 16}px`;
    const right = mouseX > midPosPx ? `${rangeLeftRightPx[1] - mouseX}px` : "";
    select(infoRef)
        .style("left", left)
        .style("right", right)
        .style("top", `${mouseY-20}px`)
        .style("visibility", "visible")
        .html(`
        Sample: ${samples[i]}
        <br/>
        ${d} mapped reads
      `);
  }
  function handleMouseOut() {
    select(infoRef).style("visibility", "hidden");
  }

  svg.selectAll(".bar").remove();
  svg.selectAll(".bar")
      // .append("g")
      // .attr("class", "bars")
      .data(counts)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (count, sampleIdx) => scales.x(sampleIdx) - 0.5*barWidth+1)
      .attr("width", barWidth-1)
      .attr("y", (count) => scales.y(count))
      .attr("fill", (count, sampleIdx) => colours[sampleIdx])
      .attr("height", (count) => chartGeom.height - chartGeom.spaceBottom - scales.y(count))
      .on("mouseout", handleMouseOut)
      .on("mousemove", handleMouseMove)
      .on("click", (d, i) => goToSamplePanel(samples[i]));

  /* render the column labels (sample numbers or names) on the bottom */
  const sampleName = (d) => {
    const charPx = 4; /* guesstimate of character pixel width */
    const allowedChars = Math.floor(chartGeom.spaceBottom / charPx);
    if (d.length > allowedChars) {
      return `${d.slice(0,allowedChars-2)}...`;
    }
    return d;
  };
  svg.selectAll(".sampleName").remove();
  svg.selectAll(".sampleName")
      .data(samples)
      .enter()
      .append("g")
      .attr("class", "sampleName")
      .append("text")
      .attr("class", "axis")
      .attr("transform", (name, idx) => `rotate(-45 ${scales.x(idx)} ${chartGeom.height - chartGeom.spaceBottom + 10})`)
      // .text((name, idx) => idx + 1)
      .text(sampleName)
      .attr('x', (name, idx) => scales.x(idx))
      .attr('y', chartGeom.height - chartGeom.spaceBottom + 10)
      .attr("text-anchor", "end")
      .attr("font-size", "12px")
      .attr("alignment-baseline", "hanging");
};


class ReadsPerSample extends React.Component {
  constructor(props) {
    super(props);
    this.state = {chartGeom: {}, logScale: false, hoverWidth: 0};
  }
  redraw() {
    /* currently redo everything, but we could make this much much smarter */
    const chartGeom = this.state.chartGeom;
    const samples = Object.keys(this.props.data)
        .filter((name) => name!=="all"); // TODO -- order appropriately!
    const barWidth = calculateBarWidth(chartGeom, samples.length);
    const yMax = getMaxCount({samples, data: this.props.data});
    if (!yMax) return;
    const scales = {
      x: calcXScale(chartGeom, barWidth, samples.length),
      y: calcYScale(chartGeom, yMax, getLogYAxis(this.props.config))
    };
    drawAxes(this.state.svg, chartGeom, scales, {xTicks: 0});
    const counts = [];
    const colours = [];
    samples.forEach((name) => {
      counts.push(this.props.data[name].mappedCount || 0);
      colours.push(this.props.sampleColours[name]);
    });
    drawColumns(this.state.svg, chartGeom, scales, counts, barWidth, colours, samples, this.infoRef, this.props.data, this.props.goToSamplePanel);
  }
  componentDidMount() {
    const chartGeom = calcChartGeom(this.boundingDOMref.getBoundingClientRect());
    const svg = select(this.DOMref);
    const hoverWidth = parseInt(chartGeom.width * 4/5, 10);
    this.setState({chartGeom, svg, hoverWidth})
  }
  componentDidUpdate() {
    this.redraw();
  }
  render() {
    return (
        <Container width={this.props.width} ref={(r) => {this.boundingDOMref = r}}>
          <Title>
            {this.props.title}
          </Title>
          <HoverInfoBox width={this.state.hoverWidth} ref={(r) => {this.infoRef = r}}/>
          <div className="centerHorizontally">
            <svg
                ref={(r) => {this.DOMref = r}}
                height={this.state.chartGeom.height || 0}
                width={this.state.chartGeom.width || 0}
            />
          </div>
          {this.props.renderProp ? this.props.renderProp : null}
        </Container>
    )
  }
}

export default ReadsPerSample;

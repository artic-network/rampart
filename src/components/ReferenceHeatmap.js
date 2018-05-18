import React from 'react';
import { select } from "d3-selection";
import { rgb } from "d3-color";
import { interpolateHcl } from "d3-interpolate";
import { scaleLinear } from "d3-scale";
import {calcScales, drawAxes} from "../utils/commonFunctions";
import {chartTitleCSS} from "../utils/commonStyles";

/* given the DOM dimensions of the chart container, calculate the chart geometry (used by the SVG & D3) */
const calcChartGeom = (DOMRect) => ({
  width: DOMRect.width,
  height: DOMRect.height - 20, // title line
  spaceLeft: 40,
  spaceRight: 10,
  spaceBottom: 20,
  spaceTop: 10
});

const drawHeatMap = (svg, chartGeom, scales, cfData, colourScale) => {
  /* step1 : flatten cfData */
  /* data point structure for d3: [channel # (1-based),  ref idx (1-based), ref match % (over [0, 100])] */
  const data = cfData.reduce((acc, laneData, laneIdx) => {
    const totalReadsInLane = laneData.reduce((acc, cv) => acc + cv.value, 0);
    const points = laneData.map((cellData, refIdx) => [laneIdx+1, refIdx+1, cellData.value / totalReadsInLane * 100]);
    return acc.concat(points)
  }, []);

  svg.selectAll(".heat").remove();
  const cellSize = 20;
  svg.selectAll(".heat")
    .data(data)
    .enter().append("rect")
    .attr("class", "heat")
    .attr('width', cellSize)
    .attr('height', cellSize)
    .attr("x", d => scales.x(d[0]-1))
    .attr("y", d => scales.y(d[1]))
    .attr("fill", d => colourScale(d[2]));
}

class ReferenceHeatmap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {chartGeom: {}};
  }
  componentDidMount() {
    const newState = {
      SVG: select(this.DOMref),
      chartGeom: calcChartGeom(this.boundingDOMref.getBoundingClientRect())
    }
    /* PS the scales never need updating :) */
    newState.scales = calcScales(
      newState.chartGeom,
      this.props.refMatchPerChannel.length,
      this.props.refMatchPerChannel[0].length
    );
    newState.heatColourScale = scaleLinear()
      .domain([0, 100])
      // .range(heatColours)
      .interpolate(interpolateHcl)
      .range([rgb("#007AFF"), rgb('#FFF500')]);
    drawAxes(newState.SVG, newState.chartGeom, newState.scales)
    drawHeatMap(newState.SVG, newState.chartGeom, newState.scales, this.props.refMatchPerChannel, newState.heatColourScale)
    this.setState(newState);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.version !== this.props.version) {
      drawHeatMap(this.state.SVG, this.state.chartGeom, this.state.scales, this.props.refMatchPerChannel, this.state.heatColourScale)
    }
  }
  render() {
    return (
      <div style={{...this.props.style}} ref={(r) => {this.boundingDOMref = r}}>
        <div {...chartTitleCSS}>{this.props.title}</div>
        <svg
          ref={(r) => {this.DOMref = r}}
          height={this.state.chartGeom.height || 0}
          width={this.state.chartGeom.width || 0}
        />
      </div>
    )
  }
}

export default ReferenceHeatmap;

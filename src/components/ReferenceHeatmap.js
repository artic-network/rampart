import React from 'react';
import { select } from "d3-selection";
import { rgb } from "d3-color";
import { interpolateHcl } from "d3-interpolate";
import { scaleLinear } from "d3-scale";
import {calcScales} from "../utils/commonFunctions";
import {chartTitleCSS} from "../utils/commonStyles";

/* given the DOM dimensions of the chart container, calculate the chart geometry (used by the SVG & D3) */
const calcChartGeom = (DOMRect) => ({
  width: DOMRect.width,
  height: DOMRect.height - 20, // title line
  spaceLeft: 280,
  spaceRight: 10,
  spaceBottom: 60,
  spaceTop: 10
});

const calcCellDims = (chartGeom, cfData) => {
  const cellPadding = 1;
  const availableWidth = chartGeom.width - chartGeom.spaceLeft - chartGeom.spaceRight;
  const availableHeight = chartGeom.height - chartGeom.spaceBottom - chartGeom.spaceTop;
  const cellWidth = availableWidth / cfData.length - cellPadding;
  const cellHeight = availableHeight / cfData[0].length - cellPadding;
  return {
    height: cellHeight,
    width: cellWidth,
    padding: cellPadding
  }
}

const drawHeatMap = (svg, chartGeom, scales, cellDims, cfData, colourScale) => {
  /* step1 : flatten cfData */
  /* data point structure for d3: [channel # (1-based),  ref idx (1-based), ref match % (over [0, 100])] */
  const data = cfData.reduce((acc, laneData, laneIdx) => {
    const totalReadsInLane = laneData.reduce((acc, cv) => acc + cv.value, 0);
    const points = laneData.map((cellData, refIdx) => [laneIdx+1, refIdx+1, cellData.value / totalReadsInLane * 100]);
    return acc.concat(points)
  }, []);

  svg.selectAll(".refLabel")
      .data(cfData[0].map((x) => x.key)) /* get the labels */
      .enter()
      .append("text")
      .attr("class", "refLabel")
      .text((d) => d)
      .attr('y', (d, i) => scales.y(i+1) + 0.5*cellDims.height) /* +1 as that's what we do in the data reduction above */
      .attr('x', chartGeom.spaceLeft - 2)
      .attr("text-anchor", "end")
      .attr("font-size", "12px")
      .attr("alignment-baseline", "middle") /* i.e. y value specifies top of text */

  svg.selectAll(".channel")
      .data(cfData.map((d, i) => i+1)) /* get the channels - +1 as per data reduce above */
      .enter()
      .append("text")
      .attr("class", "channel")
      .text((d) => d)
      .attr('x', (d) => scales.x(d) - 0.5*cellDims.width)
      .attr('y', chartGeom.height - chartGeom.spaceBottom + 5)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("alignment-baseline", "hanging")

  svg.selectAll(".heat").remove();
  svg.selectAll(".heat")
    .data(data)
    .enter().append("rect")
    .attr("class", "heat")
    .attr('width', cellDims.width)
    .attr('height', cellDims.height)
    .attr("x", d => scales.x(d[0]-1) + cellDims.padding)
    .attr("y", d => scales.y(d[1]) + cellDims.padding)
    .attr("fill", d => colourScale(d[2]));


  const legendDataValues = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const legendBoxWidth = (chartGeom.width - chartGeom.spaceRight) / (legendDataValues.length -1);
  const legendBoxHeight = 12;
  const legendRoof = chartGeom.height - chartGeom.spaceBottom + 32;

  const legend = svg.selectAll(".legend")
    .data(legendDataValues.slice(0, legendDataValues.length-1)) /* don't include the last one... */
    .enter().append("g")
      .attr("class", "legend")

  legend.append("rect")
    .attr('y', legendRoof)
    .attr("x", (d, i) => legendBoxWidth * i)
    .attr("width", legendBoxWidth)
    .attr("height", legendBoxHeight)
    .style("fill", (d) => colourScale(d));

  legend.append("text")
    .text((d, i) => i ? d+"%" : "")
    .attr('x', (d, i) => legendBoxWidth * i)
    .attr('y', legendRoof + legendBoxHeight + 2)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("alignment-baseline", "hanging")
}

class ReferenceHeatmap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {chartGeom: {}};
  }
  componentDidMount() {
    const SVG = select(this.DOMref);
    const chartGeom = calcChartGeom(this.boundingDOMref.getBoundingClientRect());
    const cellDims = calcCellDims(chartGeom, this.props.refMatchPerChannel);

    /* PS the scales never need updating :) */
    const scales = calcScales(
      chartGeom,
      this.props.refMatchPerChannel.length,
      this.props.refMatchPerChannel[0].length
    );
    const heatColourScale = scaleLinear()
      .domain([0, 100])
      // .range(heatColours)
      .interpolate(interpolateHcl)
      .range([rgb("#007AFF"), rgb('#FFF500')]);
    drawHeatMap(SVG, chartGeom, scales, cellDims, this.props.refMatchPerChannel, heatColourScale)
    this.setState({SVG, chartGeom, cellDims, scales, heatColourScale});
  }

  componentDidUpdate(prevProps) {
    if (prevProps.version !== this.props.version) {
      drawHeatMap(this.state.SVG, this.state.chartGeom, this.state.scales, this.state.cellDims, this.props.refMatchPerChannel, this.state.heatColourScale)
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

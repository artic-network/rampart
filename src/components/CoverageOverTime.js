import React from 'react';
import { select } from "d3-selection";
import { line, curveBasis } from "d3-shape";
import {calcXScale, calcYScale, drawAxes} from "../utils/commonFunctions";
import {chartTitleCSS} from "../utils/commonStyles";
import {color as d3color} from "d3-color";

/* given the DOM dimensions of the chart container, calculate the chart geometry (used by the SVG & D3) */
const calcChartGeom = (DOMRect) => ({
  width: DOMRect.width,
  height: DOMRect.height - 20, // title line
  spaceLeft: 50,
  spaceRight: 10,
  spaceBottom: 60,
  spaceTop: 10
});

export const drawLines = (svg, scales, data, colour) => {
  /* this is all a bit hacky */

  const lineFactory = (idx) => line()
    .x((d) => scales.x(d[0]))
    .y((d) => scales.y(d[idx+1]))
    .curve(curveBasis);

  const colours = [d3color(colour).brighter(2), d3color(colour), d3color(colour).darker(2)];

  svg.selectAll(".coverageLine").remove();
  svg.selectAll(".coverageLine")
    .data([data, data, data]) /* instead of flatenning the data */
    .enter().append("path")
      .attr("class", "coverageLine")
      .attr("fill", "none")
      .attr("stroke", (d, i) => colours[i])
      .attr("stroke-width", 5)
      .attr('d', (d, i) => lineFactory(i)(d));
}

class CoverageOverTime extends React.Component {
  constructor(props) {
    super(props);
    this.state = {chartGeom: {}};
  }
  componentDidMount() {
    const svg = select(this.DOMref);
    const chartGeom = calcChartGeom(this.boundingDOMref.getBoundingClientRect());
    const yScale = calcYScale(chartGeom, 100);
    this.setState({svg, chartGeom, yScale});
  }
  componentDidUpdate(prevProps) {
    this.state.svg.selectAll("*").remove();
    const finalDataPt = this.props.coverageOverTime[this.props.coverageOverTime.length-1];
    const timeMax = (parseInt(finalDataPt[0]/30, 10) +1) * 30;
    const scales = {x: calcXScale(this.state.chartGeom, timeMax), y: this.state.yScale};
    drawAxes(this.state.svg, this.state.chartGeom, scales, {x: 3, y: 5});
    drawLines(this.state.svg, scales, this.props.coverageOverTime, this.props.colour);
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

export default CoverageOverTime;

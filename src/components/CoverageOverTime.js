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

const drawLines = (svg, scales, data, colours) => {
  svg.selectAll(".coverageLine").remove();
  svg.selectAll(".coverageLine")
    .data([1, 2, 3]) /* indexes of coverage value we want for each line */
    .enter().append("path")
      .attr("class", "coverageLine")
      .attr("fill", "none")
      .attr("stroke", (d, i) => colours[i])
      .attr("stroke-width", 5)
      .attr('d', (covIdx) => {
        const generator = line()
          .x((d) => scales.x(d[0]))
          .y((d) => scales.y(d[covIdx]))
          .curve(curveBasis);
        return generator(data)
      });
}

const drawLegend = (svg, chartGeom, colours) => {
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${chartGeom.spaceLeft}, ${chartGeom.spaceTop + 5})`)

  const labels = ["1000x", "100x", "10x"];

  legend.selectAll("line")
    .data(colours)
    .enter()
    .append("path")
      .attr("d", (d, i) => `M10,${20*i} H50`)
      .attr("stroke-width", 5)
      .attr("stroke", (d) => d)

  legend.selectAll("line")
    .data(colours)
    .enter()
    .append("text")
      .attr("x", 55)
      .attr("y", (d, i) => 20*i + 4)
      .text((d, i) => labels[i]);

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
    const colours = (this.props.sampleIdx/this.props.numSamples < 0.5) ?
      [d3color(this.props.colour).darker(4), d3color(this.props.colour).darker(2), d3color(this.props.colour)] :
      [d3color(this.props.colour), d3color(this.props.colour).brighter(2), d3color(this.props.colour).brighter(4)];
    drawLegend(svg, chartGeom, colours)
    this.setState({svg, chartGeom, yScale, colours});
  }
  componentDidUpdate(prevProps) {
    const finalDataPt = this.props.coverageOverTime[this.props.coverageOverTime.length-1];
    const timeMax = (parseInt(finalDataPt[0]/30, 10) +1) * 30;
    const scales = {x: calcXScale(this.state.chartGeom, timeMax), y: this.state.yScale};
    drawAxes(this.state.svg, this.state.chartGeom, scales, {xTicks: 4, yTicks:5, isTime: true, ySuffix: "%"});
    drawLines(this.state.svg, scales, this.props.coverageOverTime, this.state.colours);
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

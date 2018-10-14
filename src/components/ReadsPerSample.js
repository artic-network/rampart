import React from 'react';
import { select } from "d3-selection";
import {drawAxes} from "../utils/commonFunctions";
import {chartTitleCSS} from "../utils/commonStyles";
import {scaleLinear, scaleLog, scaleOrdinal} from "d3-scale";
import { max } from "d3-array";

/* given the DOM dimensions of the chart container, calculate the chart geometry (used by the SVG & D3) */
const calcChartGeom = (DOMRect) => ({
  width: DOMRect.width,
  height: DOMRect.height - 20, // title line
  spaceLeft: 60,
  spaceRight: 0,
  spaceBottom: 60,
  spaceTop: 10
});

const calculateBarWidth = (chartGeom, numSamples) =>
  ((chartGeom.width - chartGeom.spaceLeft - chartGeom.spaceRight) / numSamples);

const getYMax = (data, resolution) =>
  (parseInt(max(data)/resolution, 10)+1)*resolution;

const calcXScale = (chartGeom, barWidth, numSamples) => {
  const xValues = Array.from(new Array(numSamples), (_, i) => i);
  return scaleOrdinal()
    .domain(xValues)
    .range(xValues.map(x => (x+0.5)*barWidth + chartGeom.spaceLeft))
}

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
}


const drawColumns = (svg, chartGeom, scales, counts, barWidth, colours) => {
  svg.selectAll(".bar").remove();
  svg.selectAll(".bar")
    .data(counts)
    .enter()
      .append("rect")
        .attr("class", "bar")
        .attr("x", (count, sampleIdx) => scales.x(sampleIdx) - 0.5*barWidth+1)
        .attr("width", barWidth-1)
        .attr("y", (count) => scales.y(count))
        .attr("fill", (count, sampleIdx) => colours[sampleIdx])
        .attr("height", (count) => chartGeom.height - chartGeom.spaceBottom - scales.y(count))
}


class ReadsPerSample extends React.Component {
  constructor(props) {
    super(props);
    this.state = {chartGeom: {}, logScale: false};
    this.handleKeyDown = (event) => {
      switch(event.keyCode) {
        case 76: // key: "l"
          this.setState({logScale: !this.state.logScale})
          break;
        default:
          break;
      }
    }
  }
  componentWillMount() {
    document.addEventListener("keydown", this.handleKeyDown);
  }
  componentDidMount() {
    const chartGeom = calcChartGeom(this.boundingDOMref.getBoundingClientRect());
    const svg = select(this.DOMref);
    const numSamples = this.props.readCountPerSample.length;
    const barWidth = calculateBarWidth(chartGeom, numSamples);
    const xScale = calcXScale(chartGeom, barWidth, numSamples);
    this.setState({svg, chartGeom, xScale, barWidth});
  }
  componentDidUpdate(prevProps) {
    const yMax = getYMax(this.props.readCountPerSample, 10000);
    const scales = {x: this.state.xScale, y: calcYScale(this.state.chartGeom, yMax, this.state.logScale)};
    drawAxes(this.state.svg, this.state.chartGeom, scales)
    drawColumns(this.state.svg, this.state.chartGeom, scales, this.props.readCountPerSample, this.state.barWidth, this.props.colours)
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

export default ReadsPerSample;

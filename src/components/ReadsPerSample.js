import React from 'react';
import { select } from "d3-selection";
import {haveMaxesChanged, drawAxes} from "../utils/commonFunctions";
import {sampleColours, chartTitleCSS} from "../utils/commonStyles";
import {scaleLog, scaleOrdinal} from "d3-scale";
import { max } from "d3-array";

/* given the DOM dimensions of the chart container, calculate the chart geometry (used by the SVG & D3) */
const calcChartGeom = (DOMRect) => ({
  width: DOMRect.width,
  height: DOMRect.height - 20, // title line
  spaceLeft: 50,
  spaceRight: 10,
  spaceBottom: 60,
  spaceTop: 10
});

const calculateBarWidth = (chartGeom, numSamples) =>
  ((chartGeom.width - chartGeom.spaceLeft - chartGeom.spaceRight) / numSamples) - 1;

const getYMax = (data, resolution) =>
  (parseInt(max(data)/resolution, 10)+1)*resolution;

const calcScales = (chartGeom, barWidth, numSamples, maxReads) => {
  /* scales.x(sampleIdx) = middle pixel value of the bar */
  const xValues = Array.from(new Array(numSamples), (_, i) => i);
  return {
    x: scaleOrdinal()
      .domain(xValues)
      .range(xValues.map(x => (x+0.5)*barWidth + chartGeom.spaceLeft)),
    y: scaleLog()
      .base(10)
      .domain([10, maxReads])
      .range([chartGeom.height - chartGeom.spaceBottom, chartGeom.spaceTop])
      .clamp(true)
  }
}

const drawColumns = (svg, chartGeom, scales, counts, barWidth) => {
  svg.selectAll(".bar").remove();
  svg.selectAll(".bar")
    .data(counts)
    .enter()
      .append("rect")
        .attr("class", "bar")
        .attr("x", (count, sampleIdx) => scales.x(sampleIdx) - 0.5*barWidth)
        .attr("width", barWidth)
        .attr("y", (count) => scales.y(count))
        .attr("fill", (count, sampleIdx) => sampleColours[sampleIdx])
        .attr("height", (count) => chartGeom.height - chartGeom.spaceBottom - scales.y(count))
}


class ReadsPerSample extends React.Component {
  constructor(props) {
    super(props);
    this.state = {chartGeom: {}};
  }
  componentDidMount() {
    const chartGeom = calcChartGeom(this.boundingDOMref.getBoundingClientRect());
    const svg = select(this.DOMref);
    const numSamples = this.props.readCountPerSample.length;
    const yMaxResolution = 10000;
    const yMax = getYMax(this.props.readCountPerSample, yMaxResolution);
    const barWidth = calculateBarWidth(chartGeom, numSamples)
    const scales = calcScales(chartGeom, barWidth, numSamples, yMax);
    drawAxes(svg, chartGeom, scales)
    drawColumns(svg, chartGeom, scales, this.props.readCountPerSample, barWidth)
    this.setState({chartGeom, svg, scales, barWidth, yMaxResolution, numSamples});
  }

  componentDidUpdate(prevProps) {
    if (prevProps.version === this.props.version) return;
    /* if the yMax has changed, the scales must recalculate (and redraw) */
    const yMax = getYMax(this.props.readCountPerSample, this.state.yMaxResolution);
    let newScales;
    if (haveMaxesChanged(this.state.scales, this.state.numSamples, yMax)) {
      newScales = calcScales(this.state.chartGeom, this.state.barWidth, this.state.numSamples, yMax);
      drawAxes(this.state.svg, this.state.chartGeom, newScales)
    }
    drawColumns(this.state.svg, this.state.chartGeom, newScales || this.state.scales, this.props.readCountPerSample, this.state.barWidth)
    if (newScales) this.setState({scales: newScales});
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

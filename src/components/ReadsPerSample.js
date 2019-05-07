import React from 'react';
import { select, mouse } from "d3-selection";
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

const getMaxCount = ({samples, data, resolution}) => {
  let maxCount = 0;
  for (const sampleName of samples) {
    if (data[sampleName].mappedCount && data[sampleName].mappedCount > maxCount) maxCount = data[sampleName].mappedCount;
  }
  return maxCount ? (parseInt(maxCount/resolution, 10)+1)*resolution : 0;
}

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


const drawColumns = (svg, chartGeom, scales, counts, barWidth, colours, samples, infoRef, data) => {

  function handleMouseMove(d, i) {
    const [mouseX, mouseY] = mouse(this); // [x, y] x starts from left, y starts from top
    const left  = mouseX > 0.5 * scales.x.range()[1] ? "" : `${mouseX + 16}px`;
    const right = mouseX > 0.5 * scales.x.range()[1] ? `${scales.x.range()[1] - mouseX}px` : "";
    select(infoRef)
      .style("left", left)
      .style("right", right)
      .style("top", `${mouseY-35}px`)
      .style("visibility", "visible")
      .html(`
        Sample: ${samples[i]}
        <br/>
        ${d} mapped reads
        <br/>
        ${data[samples[i]].demuxedCount} demuxed reads
      `);
  }
  function handleMouseOut() {
    select(infoRef).style("visibility", "hidden");
  }

  svg.selectAll(".bar").remove();
  svg.selectAll(".bar")
    .append("g")
    .attr("class", "bars")
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
        .on("mousemove", handleMouseMove);
}


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
    const yMax = getMaxCount({samples, data: this.props.data, resolution: 10000});
    if (!yMax) return;
    const scales = {
      x: calcXScale(chartGeom, barWidth, samples.length),
      y: calcYScale(chartGeom, yMax, this.props.viewOptions.logYAxis)
    };
    drawAxes(this.state.svg, chartGeom, scales);
    const counts = [];
    const colours = [];
    samples.forEach((name) => {
      counts.push(this.props.data[name].mappedCount || 0);
      colours.push(this.props.viewOptions.sampleColours[name] || "white");
    });
    drawColumns(this.state.svg, chartGeom, scales, counts, barWidth, colours, samples, this.infoRef, this.props.data);
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
      <div className={this.props.className} style={{width: this.props.width}} ref={(r) => {this.boundingDOMref = r}}>
        <div className="chartTitle">
          {this.props.title}
        </div>
        <div className="hoverInfo" style={{maxWidth: this.state.hoverWidth}} ref={(r) => {this.infoRef = r}}/>
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

import React from 'react';
import { select } from "d3-selection";
import {calcScales, drawAxes} from "../utils/commonFunctions";
import {chartTitleCSS} from "../utils/commonStyles";

/* given the DOM dimensions of the chart container, calculate the chart geometry (used by the SVG & D3) */
const calcChartGeom = (DOMRect) => ({
  width: DOMRect.width,
  height: DOMRect.height - 20, // title line
  spaceLeft: 40,
  spaceRight: 10,
  spaceBottom: 60,
  spaceTop: 10
});

const colours = [
  '#b2182b',
  '#ef8a62',
  '#fddbc7',
  '#d1e5f0',
  '#67a9cf',
  '#2166ac'
]

const drawRefChart = (svg, chartGeom, scales, data) => {
  svg.selectAll(".bar").remove();
  svg.selectAll(".bar")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", scales.x(0) + 1)
    .attr("width", d => scales.x(d.value))
    .attr("y", (d, i) => scales.y(i) - 20)
    .attr("height", 20)
    .attr("fill",(d, i) => colours[i]);
  /* labels */
  svg.selectAll(".text").remove();
  svg.selectAll(".text")
    .data(data)
    .enter().append("text")
    .attr("class", "text")
    .attr("x", scales.x(0) + 1)
    .attr("y", (d, i) => scales.y(i) - 2)
    .attr("font-family", "lato")
    .attr("font-size", "20px")
    .attr("fill", "white")
    .text(d => d.key);

}

const getMaxNumReadsForRefs = (data) => {
  return data.map( el => el.value ).reduce((max, cur) => Math.max( max, cur ), -Infinity )
}

class ReferenceMatches extends React.Component {
  constructor(props) {
    super(props);
    this.state = {chartGeom: {}};
  }
  redraw(SVG, chartGeom, data) {
    const refMatchMax = getMaxNumReadsForRefs(data);
    const scales = calcScales(chartGeom, refMatchMax, data.length);
    drawAxes(SVG, chartGeom, scales);
    drawRefChart(SVG, chartGeom, scales, data);
  }
  componentDidMount() {
    const SVG = select(this.DOMref);
    const chartGeom = calcChartGeom(this.boundingDOMref.getBoundingClientRect());
    this.redraw(SVG, chartGeom, this.props.refMatch);
    this.setState({SVG, chartGeom});
  }
  componentDidUpdate(prevProps) {
    if (prevProps.version !== this.props.version) {
      this.redraw(this.state.SVG, this.state.chartGeom, this.props.refMatch);
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

export default ReferenceMatches;

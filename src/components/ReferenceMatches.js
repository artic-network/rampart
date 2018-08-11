import React from 'react';
import { select } from "d3-selection";
import {calcScales, drawXAxis} from "../utils/commonFunctions";
import {chartTitleCSS} from "../utils/commonStyles";
import { max } from "d3-array";

/* given the DOM dimensions of the chart container, calculate the chart geometry (used by the SVG & D3) */
const calcChartGeom = (DOMRect) => ({
    width: DOMRect.width,
    height: DOMRect.height - 20, // title line
    spaceLeft:  75, // space for the reference names
    spaceRight: 10,
    spaceBottom: 60,
    spaceTop: 10
});


class ReferenceMatches extends React.Component {
  constructor(props) {
    super(props);
    this.state = {chartGeom: {}};
  }
  redraw(SVG, chartGeom) {
    console.log(this.props)
    const maxReadCount = max(this.props.refMatchCounts);
    const scales = calcScales(chartGeom, maxReadCount, this.props.refMatchCounts.length);
    SVG.selectAll("*").remove();
    drawXAxis(SVG, chartGeom, scales, {x: 4});

    /* render the reference names (on the far left) */
    SVG.selectAll(".refLabel")
      .data(this.props.references) /* get the labels */
      .enter()
        .append("text")
          .attr("class", "refLabel")
          .text((d) => d.slice(0,8) + "...")
          .attr('y', (d, i) => scales.y(i+0.5))
          .attr('x', chartGeom.spaceLeft - 2)
          .attr("text-anchor", "end")
          .attr("font-size", "12px")
          .attr("alignment-baseline", "middle") /* i.e. y value specifies top of text */

    /* render the bars */
    const barHeight = scales.y(0) - scales.y(1) - 4;
    SVG.selectAll(".bar")
      .data(this.props.refMatchCounts)
      .enter()
        .append("rect")
          .attr("class", "bar")
          .attr('width', (d) => scales.x(d))
          .attr('height', barHeight)
          .attr("x", (d) => scales.x(0))
          .attr("y", (d, i) => scales.y(i+1))
          .attr("fill", this.props.colour);
  }
  componentDidMount() {
    const SVG = select(this.DOMref);
    const chartGeom = calcChartGeom(this.boundingDOMref.getBoundingClientRect());
    this.redraw(SVG, chartGeom);
    this.setState({SVG, chartGeom});
  }
  componentDidUpdate(prevProps) {
    if (prevProps.version !== this.props.version) {
      this.redraw(this.state.SVG, this.state.chartGeom);
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

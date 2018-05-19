import React from 'react';
import { select } from "d3-selection";
import {haveMaxesChanged, calcScales, drawAxes} from "../utils/commonFunctions";
import {chartTitleCSS} from "../utils/commonStyles";

/* given the DOM dimensions of the chart container, calculate the chart geometry (used by the SVG & D3) */
const calcChartGeom = (DOMRect) => ({
  width: DOMRect.width,
  height: DOMRect.height - 20, // title line
  spaceLeft: 50,
  spaceRight: 10,
  spaceBottom: 60,
  spaceTop: 10
});

const getMaxsOfReadsOverTime = (readsOverTime) => {
  const finalPoint = readsOverTime.slice(-1)[0];
  const timeMax = finalPoint[0] > 60 ? finalPoint[0] : 30;
  const readsMax = finalPoint[1] > 10000 ? finalPoint[1] : 10000;
  return [timeMax, readsMax]
}


const drawScatter = (svg, chartGeom, scales, data) => {
  svg.selectAll(".scatterDot").remove();
  svg.selectAll(".scatterDot")
    .data(data)
    .enter().append("circle")
    .attr("class", "scatterDot")
    .attr("r", 5)
    .attr("cx", d => scales.x(d[0]))
    .attr("cy", d => scales.y(d[1]))
    .attr("fill", "black");
}

class ReadsOverTime extends React.Component {
  constructor(props) {
    super(props);
    this.state = {chartGeom: {}};
  }
  componentDidMount() {
    const newState = {
      SVG: select(this.DOMref),
      chartGeom: calcChartGeom(this.boundingDOMref.getBoundingClientRect())
    }
    newState.scales = calcScales(newState.chartGeom, ...getMaxsOfReadsOverTime(this.props.readsOverTime));
    drawAxes(newState.SVG, newState.chartGeom, newState.scales)
    drawScatter(newState.SVG, newState.chartGeom, newState.scales, this.props.readsOverTime)
    this.setState(newState);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.version !== this.props.version) {
      const newState = {
        scales: this.state.scales
      };
      const timeMaxReadsMax = getMaxsOfReadsOverTime(this.props.readsOverTime);
      if (haveMaxesChanged(this.state.scales, ...timeMaxReadsMax)) {
        newState.scales = calcScales(this.state.chartGeom, ...timeMaxReadsMax);
        drawAxes(this.state.SVG, this.state.chartGeom, newState.scales)
      }
      drawScatter(this.state.SVG, this.state.chartGeom, newState.scales, this.props.readsOverTime)
      this.setState(newState)
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

export default ReadsOverTime;

import React from 'react';
import { select } from "d3-selection";
import {haveMaxesChanged, calcScales, drawAxes} from "../utils/commonFunctions";
import {channelColours, chartTitleCSS} from "../utils/commonStyles";

/* given the DOM dimensions of the chart container, calculate the chart geometry (used by the SVG & D3) */
const calcChartGeom = (DOMRect) => ({
  width: DOMRect.width,
  height: DOMRect.height - 20, // title line
  spaceLeft: 50,
  spaceRight: 10,
  spaceBottom: 60,
  spaceTop: 10
});

const processReadsPerChannel = (readsPerChannel) => {
  const xy = readsPerChannel.map((cf, idx) => [idx+1, cf.size()]);
  return {
    xy,
    maxX: readsPerChannel.length,
    maxY: xy.reduce((max, cv) => cv[1] > max ? cv[1] : max, 0)
  }
}

const drawBars = (svg, chartGeom, scales, data, fills) => {
  svg.selectAll(".bar").remove();
  svg.selectAll(".bar")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", d => scales.x(d[0]))
    .attr("width", 10) // TODO
    .attr("y", d => scales.y(d[1]))
    .attr("fill",(d, i) => fills[i])
    .attr("height", d => chartGeom.height - chartGeom.spaceBottom - scales.y(d[1]));
}


class ReadsPerChannel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {chartGeom: {}};
  }
  componentDidMount() {
    const newState = {
      SVG: select(this.DOMref),
      chartGeom: calcChartGeom(this.boundingDOMref.getBoundingClientRect())
    }
    const rpc = processReadsPerChannel(this.props.readsPerChannel);
    newState.scales = calcScales(newState.chartGeom, rpc.maxX, rpc.maxY);
    drawAxes(newState.SVG, newState.chartGeom, newState.scales)
    drawBars(newState.SVG, newState.chartGeom, newState.scales, rpc.xy, channelColours)
    this.setState(newState);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.version !== this.props.version) {
      const newState = {
        scales: this.state.scales
      };
      const rpc = processReadsPerChannel(this.props.readsPerChannel);
      if (haveMaxesChanged(this.state.scales, rpc.maxX, rpc.maxY)) {
        newState.scales = calcScales(this.state.chartGeom, rpc.maxX, rpc.maxY);
        drawAxes(this.state.SVG, this.state.chartGeom, newState.scales)
      }
      drawBars(this.state.SVG, this.state.chartGeom, newState.scales, rpc.xy, channelColours)
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

export default ReadsPerChannel;

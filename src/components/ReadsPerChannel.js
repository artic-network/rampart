import React from 'react';
import { select } from "d3-selection";
import {haveMaxesChanged, calcScalesOrdinalX, drawAxes} from "../utils/commonFunctions";
import {channelColours, chartTitleCSS} from "../utils/commonStyles";
import {scaleLinear, scaleOrdinal} from "d3-scale";

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
  const trueMaxY = xy.reduce((max, cv) => cv[1] > max ? cv[1] : max, 0);
  return {
    xy,
    maxX: readsPerChannel.length,
    maxY: (parseInt(trueMaxY/1000, 10) +1) * 1000
  }
}

const calcScales = (chartGeom, nX, maxY) => {
    const xRangePerPoint = (chartGeom.width - chartGeom.spaceRight - chartGeom.spaceLeft) / nX;
    return {
        x: scaleOrdinal()
            .domain([...Array(nX).keys()].map(x => x+1))
            .range([...Array(nX).keys()].map(x => (x+1)*xRangePerPoint + (chartGeom.spaceLeft / 2))),
        y: scaleLinear()
            .domain([0, maxY])
            .range([chartGeom.height - chartGeom.spaceBottom, chartGeom.spaceTop])
    }
}

const columnWidth = 32;

const drawColumns = (svg, chartGeom, scales, data, fills) => {
  svg.selectAll(".bar").remove();
  svg.selectAll(".bar")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", d => scales.x(d[0]) - columnWidth/2)
    .attr("width", columnWidth)
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
    drawColumns(newState.SVG, newState.chartGeom, newState.scales, rpc.xy, channelColours)
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
      drawColumns(this.state.SVG, this.state.chartGeom, newState.scales, rpc.xy, channelColours)
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

import React from 'react';
import { select } from "d3-selection";
import {calcScales, drawAxes} from "../utils/commonFunctions";
import {chartTitleCSS} from "../utils/commonStyles";
import {drawCurve} from "./Coverage";

/* given the DOM dimensions of the chart container, calculate the chart geometry (used by the SVG & D3) */
const calcChartGeom = (DOMRect) => ({
  width: DOMRect.width,
  height: DOMRect.height - 20, // title line
  spaceLeft: 40,
  spaceRight: 10,
  spaceBottom: 60,
  spaceTop: 10
});

export const getMaxes = (data) => {
  const y = data.map( el => el.value )
    .reduce((max, cur) => Math.max( max, cur ), -Infinity )
  const x = data[data.length - 1].key
  return {x, y}
}

class ReadLengthDistribution extends React.Component {
  constructor(props) {
    super(props);
    this.state = {chartGeom: {}};
  }
  redraw(SVG, chartGeom, data, colour) {
    const readLengthMaxes = getMaxes(data)
    const scales = calcScales(chartGeom, readLengthMaxes.x, readLengthMaxes.y);
    drawAxes(SVG, chartGeom, scales)
    drawCurve(SVG, chartGeom, scales, [data], [colour])
  }
  componentDidMount() {
    const SVG = select(this.DOMref);
    const chartGeom = calcChartGeom(this.boundingDOMref.getBoundingClientRect());
    this.redraw(SVG, chartGeom, this.props.readLength, this.props.colour);
    this.setState({SVG, chartGeom});
  }
  componentDidUpdate(prevProps) {
    if (prevProps.version !== this.props.version) {
      this.redraw(this.state.SVG, this.state.chartGeom, this.props.readLength, this.props.colour);
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

export default ReadLengthDistribution;

import React from 'react';
import { select } from "d3-selection";
import {calcScales, drawAxes} from "../utils/commonFunctions";
import {drawSteps} from "../d3/drawSteps";
import { max } from "d3-array";

/* given the DOM dimensions of the chart container, calculate the chart geometry (used by the SVG & D3) */
const calcChartGeom = (DOMRect) => ({
  width: DOMRect.width,
  height: DOMRect.height - 20, // title line
  spaceLeft: 60,
  spaceRight: 10,
  spaceBottom: 60,
  spaceTop: 10
});

class ReadLengthDistribution extends React.Component {
  constructor(props) {
    super(props);
    this.state = {chartGeom: {}};
  }
  redraw() {
    if (!this.props.xyValues.length) return;
    const maxX = this.props.xyValues[this.props.xyValues.length-1][0];
    const maxY = max(this.props.xyValues.map((xy) => xy[1]));
    const scales = calcScales(this.state.chartGeom, maxX, maxY);
    drawAxes(this.state.svg, this.state.chartGeom, scales, {xSuffix: "bp", xTicks: 4})
    const data = [{name: "Read Lengths", xyValues: this.props.xyValues, colour: this.props.colour}];
    const hoverDisplayFunc = ({name, xValue, yValue}) => (`Read length ${xValue}bp<br/>Num reads: ${yValue}`);
    drawSteps({svg: this.state.svg, chartGeom: this.state.chartGeom, scales, data, fillBelowLine: true, hoverSelection: this.state.hoverSelection, hoverDisplayFunc});
  }
  componentDidMount() {
    const svg = select(this.DOMref);
    const hoverSelection = select(this.infoRef);
    const chartGeom = calcChartGeom(this.boundingDOMref.getBoundingClientRect());
    const hoverWidth = parseInt(chartGeom.width * 1/2, 10);
    this.setState({svg, chartGeom, hoverSelection, hoverWidth});
  }
  componentDidUpdate(prevProps) {
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

export default ReadLengthDistribution;

import React from 'react';
import { select } from "d3-selection";
import {haveMaxesChanged, drawAxes} from "../utils/commonFunctions";
import {barcodeColours, chartTitleCSS} from "../utils/commonStyles";
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

const calculateBarWidth = (chartGeom, numBarcodes) =>
  (chartGeom.width - chartGeom.spaceLeft - chartGeom.spaceRight) / numBarcodes - 1;


const processreadsPerBarcode = (readsPerBarcode) => {
  let maxNumReads = 0;
  const numBarcodes = readsPerBarcode.length - 1; // the final array in crossfilter is empty
  const points = readsPerBarcode
    .slice(0, numBarcodes)
    .map((cf, idx) => {
      const n = cf.size();  // the number of reads
      if (n > maxNumReads) maxNumReads = n;
      return [idx+1, n];     // map the data to the 1-based barcode number & the number of reads
    });
  return {
    points, // array of data points, each one [barcode_number, n(reads)]
    numBarcodes,
    maxReads: (parseInt(maxNumReads/10000, 10) +1) * 10000 // to nearest 10k
  }
}

const calcScales = (chartGeom, barWidth, numBarcodes, maxReads) => {
    const xValues = Array.from(new Array(numBarcodes), (_, i) => i+1);
    return {
        x: scaleOrdinal()
            .domain(xValues)
            .range(xValues.map(x => (x-0.4)*barWidth + chartGeom.spaceLeft)),
        y: scaleLinear()
            .domain([0, maxReads])
            .range([chartGeom.height - chartGeom.spaceBottom, chartGeom.spaceTop])
    }
}

const drawColumns = (svg, chartGeom, scales, dataPoints, barWidth) => {
  svg.selectAll(".bar").remove();
  svg.selectAll(".bar")
    .data(dataPoints)
    .enter()
      .append("rect")
        .attr("class", "bar")
        .attr("x", d => scales.x(d[0]) - 0.5*barWidth)
        .attr("width", barWidth)
        .attr("y", d => scales.y(d[1]))
        .attr("fill", (d, i) => barcodeColours[i])
        .attr("height", d => chartGeom.height - chartGeom.spaceBottom - scales.y(d[1]))
}


class ReadsPerBarcode extends React.Component {
  constructor(props) {
    super(props);
    this.state = {chartGeom: {}};
  }
  componentDidMount() {
    const chartGeom = calcChartGeom(this.boundingDOMref.getBoundingClientRect());
    const svg = select(this.DOMref);
    const data = processreadsPerBarcode(this.props.readsPerBarcode);
    const barWidth = calculateBarWidth(chartGeom, data.points.length)
    const scales = calcScales(chartGeom, barWidth, data.numBarcodes, data.maxReads);
    drawAxes(svg, chartGeom, scales)
    drawColumns(svg, chartGeom, scales, data.points, barWidth)
    this.setState({chartGeom, svg, scales, barWidth});
  }

  componentDidUpdate(prevProps) {
    if (prevProps.version === this.props.version) return;
    const data = processreadsPerBarcode(this.props.readsPerBarcode);
    /* if the numBarcodes / maxRead # has changed, the scales & barWidth must recalculate (and redraw) */
    if (haveMaxesChanged(this.state.scales, data.numBarcodes, data.maxReads)) {
      const barWidth = calculateBarWidth(this.state.chartGeom, data.points.length);
      const scales = calcScales(this.state.chartGeom, barWidth, data.numBarcodes, data.maxReads);
      drawAxes(this.state.svg, this.state.chartGeom, scales)
      drawColumns(this.state.svg, this.state.chartGeom, scales, data.points, barWidth)
      this.setState({scales, barWidth});
    } else {
      /* the scales (& barWidth) in state is valid - simply redraw using these */
      drawColumns(this.state.svg, this.state.chartGeom, this.state.scales, data.points, this.state.barWidth)
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

export default ReadsPerBarcode;

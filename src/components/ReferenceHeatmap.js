import React from 'react';
import { select } from "d3-selection";
import { rgb } from "d3-color";
import { interpolateHcl } from "d3-interpolate";
import { scaleLinear } from "d3-scale";
import {calcScales} from "../utils/commonFunctions";
import {chartTitleCSS} from "../utils/commonStyles";

/* given the DOM dimensions of the chart container, calculate the chart geometry (used by the SVG & D3) */
const calcChartGeom = (DOMRect) => ({
  width: DOMRect.width,
  height: DOMRect.height - 20, // title line
  spaceLeft: 75, // space for the reference names
  spaceRight: 10,
  spaceBottom: 60,
  spaceTop: 10
});

const calcCellDims = (chartGeom, numBarcodes, numReferences) => {
  const cellPadding = 1;
  const availableWidth = chartGeom.width - chartGeom.spaceLeft - chartGeom.spaceRight;
  const availableHeight = chartGeom.height - chartGeom.spaceBottom - chartGeom.spaceTop;
  const cellWidth = availableWidth/numBarcodes - cellPadding;
  const cellHeight = availableHeight/numReferences - cellPadding;
  return {
    height: cellHeight,
    width: cellWidth,
    padding: cellPadding
  }
}

const drawHeatMap = (state, props) => {

  /* convert the refMatchPerBarcode data from raw counts to percentages & change to a d3-friendly.
  Input format:
    props.refMatchPerBarcode[barcode_idx][reference_idx] = INT
  Output data format:
    data[barcode_number (1-based),   ref_idx (this.props.references),    ref_match (percentage)]
  */
  const data = Array.from(new Array(state.numBarcodes*props.references.length));
  let dataIdx = 0;
  for (let barcodeIdx=1; barcodeIdx<state.numBarcodes+1; barcodeIdx++) {
    const totalReads = props.refMatchPerBarcode[barcodeIdx].reduce((n, val) => n+val, 0);
    for (let refIdx=0; refIdx<props.references.length; refIdx++) {
      const perc = totalReads === 0 ? 0 : props.refMatchPerBarcode[barcodeIdx][refIdx] / totalReads * 100;
      data[dataIdx] = [
        barcodeIdx, // barcode_number (1-based)
        refIdx,     // index for this.props.references
        perc
      ];
      dataIdx++;
    }
  }

  /* remove the previous renderings... */
  state.svg.selectAll("*").remove();

  /* render the reference names (on the far left) */
  state.svg.selectAll(".refLabel")
      .data(props.references) /* get the labels */
      .enter()
      .append("text")
      .attr("class", "refLabel")
      .text((d) => d.slice(0,8) + "...")
      .attr('y', (d, i) => state.scales.y(i+1) + 0.5*state.cellDims.height) /* +1 as that's what we do in the data reduction above */
      .attr('x', state.chartGeom.spaceLeft - 2)
      .attr("text-anchor", "end")
      .attr("font-size", "12px")
      .attr("alignment-baseline", "middle") /* i.e. y value specifies top of text */

  /* render the column labels (barcodes) on the bottom */
  state.svg.selectAll(".barcodeText")
      .data(Array.from(Array(state.numBarcodes).keys()))
      .enter()
      .append("text")
      .attr("class", "barcodeText")
      .text((d) => d+1)
      .attr('x', (d) => state.scales.x(d+1) - 0.5*state.cellDims.width)
      .attr('y', state.chartGeom.height - state.chartGeom.spaceBottom + 5)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("alignment-baseline", "hanging")

  /* render the coloured cells of the heatmap */
  state.svg.selectAll(".heatCell")
    .data(data)
    .enter().append("rect")
    .attr("class", "heatCell")
    .attr('width', state.cellDims.width)
    .attr('height', state.cellDims.height)
    .attr("x", d => state.scales.x(d[0]-1) + state.cellDims.padding)
    .attr("y", d => state.scales.y(d[1]+1) + state.cellDims.padding)
    .attr("fill", d => state.heatColourScale(d[2]));

  /* render the legend (bottom) -- includes coloured cells & text */
  const legendDataValues = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const legendBoxWidth = (state.chartGeom.width - state.chartGeom.spaceRight) / (legendDataValues.length -1);
  const legendBoxHeight = 12;
  const legendRoof = state.chartGeom.height - state.chartGeom.spaceBottom + 32;
  const legend = state.svg.selectAll(".legend")
    .data(legendDataValues.slice(0, legendDataValues.length-1)) /* don't include the last one... */
    .enter().append("g")
      .attr("class", "legend")
  legend.append("rect")
    .attr('y', legendRoof)
    .attr("x", (d, i) => legendBoxWidth * i)
    .attr("width", legendBoxWidth)
    .attr("height", legendBoxHeight)
    .style("fill", (d) => state.heatColourScale(d));
  legend.append("text")
    .text((d, i) => i ? d+"%" : "")
    .attr('x', (d, i) => legendBoxWidth * i)
    .attr('y', legendRoof + legendBoxHeight + 2)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("alignment-baseline", "hanging")
}

class ReferenceHeatmap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {chartGeom: {}};
  }
  componentDidMount() {
    const svg = select(this.DOMref);
    const numBarcodes = this.props.refMatchPerBarcode.length-1;
    const references = this.props.references;
    const chartGeom = calcChartGeom(this.boundingDOMref.getBoundingClientRect());
    const cellDims = calcCellDims(chartGeom, numBarcodes, references.length);
    const scales = calcScales(
      chartGeom,
      numBarcodes,      // maxX -- i.e. the number of barcodes
      references.length // maxY -- i.e. the number of references
    );

    const heatColourScale = scaleLinear()
      .domain([0, 100])
      .interpolate(interpolateHcl)
        .range([rgb('#F6EECA'), rgb('#005C68')]
      );

    const newState = {svg, chartGeom, cellDims, scales, heatColourScale, numBarcodes}
    drawHeatMap(newState, this.props);
    this.setState(newState); // may be async...
  }

  componentDidUpdate(prevProps) {
    if (prevProps.version !== this.props.version) {
      drawHeatMap(this.state, this.props);
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

export default ReferenceHeatmap;

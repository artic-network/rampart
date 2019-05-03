import React from 'react';
import {mouse, select} from "d3-selection";
import {calcScales} from "../utils/commonFunctions";
import {chartTitleCSS} from "../utils/commonStyles";
import {toolTipCSS} from "../utils/commonStyles";
import {heatColourScale} from "../utils/colours";
import {referenceDiscreteColours} from "../utils/colours";

/* given the DOM dimensions of the chart container, calculate the chart geometry (used by the SVG & D3) */
const calcChartGeom = (DOMRect) => ({
    width: DOMRect.width,
    height: DOMRect.height - 20, // title line
    spaceLeft: 140, // space for the reference names
    spaceRight: 0,
    spaceBottom: 60,
    spaceTop: 10
});

const calcCellDims = (chartGeom, numSamples, numReferences) => {
    const cellPadding = 1;
    const availableWidth = chartGeom.width - chartGeom.spaceLeft - chartGeom.spaceRight;
    const availableHeight = chartGeom.height - chartGeom.spaceBottom - chartGeom.spaceTop;
    const cellWidth = availableWidth/numSamples - cellPadding;
    const cellHeight = availableHeight/numReferences - cellPadding;
    return {
        height: cellHeight,
        width: cellWidth,
        padding: cellPadding
    }
}

const drawHeatMap = (state, props, infoRef) => {
    /* convert the refMatchPerSample data from raw counts to percentages & change to a d3-friendly struct.
    Input format:
      props.refMatchPerSample[sampleIdx][reference_idx] = INT
    Output data format:
      flat list, with each value itself a list:
        [sampleIdx, refPanelMatchIdx, fracIdentity]
    */
    const data = Array.from(new Array(state.samples.length*props.references.length));
    let dataIdx = 0;
    for (let sampleIdx=0; sampleIdx<state.samples.length; sampleIdx++) {
        const totalReads = props.refMatchPerSample[sampleIdx].reduce((n, val) => n+val, 0);
        for (let refIdx=0; refIdx<props.references.length; refIdx++) {
            const perc = totalReads === 0 ? 0 : props.refMatchPerSample[sampleIdx][refIdx] / totalReads * 100;
            data[dataIdx] = [
                sampleIdx, // 0-based sample index
                refIdx,    // 0-based reference panel index
                perc
            ];
            dataIdx++;
        }
    }

    /* NOTE scales.x(0) returns the far left pixel value of the cells, not the labels */

    /* remove the previous renderings... */
    state.svg.selectAll("*").remove();

    /* render the reference names (on the far left) */
    state.svg.selectAll(".refLabel")
        .data(props.references) /* get the labels */
        .enter()
        .append("text")
        .attr("class", "refLabel")
        .text((d) => d.name.length > 18 ? d.name.slice(0,17) + "..." : d.name) /* trim labels to 18 chars */
        .attr('y', (refName, refIdx) => state.scales.y(refIdx+1) + 0.5*state.cellDims.height)
        .attr('x', state.chartGeom.spaceLeft - 8 /* - state.cellDims.height */)
        .attr("text-anchor", "end")
        .attr("font-size", "12px")
        .attr("alignment-baseline", "middle"); /* i.e. y value specifies top of text */

    // state.svg.selectAll(".refColour")
    //     .data(props.references) /* get the labels */
    //     .enter()
    //     .append("rect")
    //     .attr("class", "refColour")
    //     .attr('width', state.cellDims.height)
    //     .attr('height', state.cellDims.height)
    //     .attr("x", state.chartGeom.spaceLeft - 4 - state.cellDims.height)
    //     .attr('y', (refName, refIdx) => state.scales.y(refIdx+1))
    //     .attr("fill", (refName, refIdx) => referenceDiscreteColours[refIdx]);

    /* render the column labels (barcodes) on the bottom */
    state.svg.selectAll(".sampleNames")
        .data(state.samples)
        .enter()
        .append("text")
        .attr("class", "sampleNames")
        .text((name, idx) => idx + 1)
        .attr('x', (name, idx) => state.scales.x(idx) + 0.5*state.cellDims.width)
        .attr('y', state.chartGeom.height - state.chartGeom.spaceBottom + 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("alignment-baseline", "hanging");

    function handleMouseMove(d, i) {
        const [mouseX, mouseY] = mouse(this); // [x, y] x starts from left, y starts from top
        const left  = mouseX > 0.5 * state.scales.x.range()[1] ? "" : `${mouseX + 16}px`;
        const right = mouseX > 0.5 * state.scales.x.range()[1] ? `${state.scales.x.range()[1] - mouseX}px` : "";
        select(infoRef)
            .style("left", left)
            .style("right", right)
            .style("top", `${mouseY}px`)
            .style("visibility", "visible")
            .html(`
                Sample: ${props.samples[d[0]]}
                <br/>
                ${parseFloat(d[2]).toFixed(2)}% reads map to ${props.references[d[1]].name}
            `);
    }
    function handleMouseOut() {
        select(infoRef).style("visibility", "hidden");
    }

    /* render the coloured cells of the heatmap */
    state.svg.selectAll(".heatCell")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "heatCell")
        .attr('width', state.cellDims.width)
        .attr('height', state.cellDims.height)
        .attr("x", d => state.scales.x(d[0]) + state.cellDims.padding)
        .attr("y", d => state.scales.y(d[1]+1) + state.cellDims.padding)
        .attr("fill", d => d[2] === 0 ? "#ccc" : heatColourScale(d[2]))
        .on("mouseout", handleMouseOut)
        .on("mousemove", handleMouseMove);

    /* render the legend (bottom) -- includes coloured cells & text */
    const legendDataValues = [0, 1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
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
        .style("fill", (d) => d === 0 ? "#ccc" : heatColourScale(d));
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
        const samples = this.props.samples;
        const references = this.props.references;
        const chartGeom = calcChartGeom(this.boundingDOMref.getBoundingClientRect());
        const cellDims = calcCellDims(chartGeom, samples.length, references.length);
        const scales = calcScales(
            chartGeom,
            samples.length,     // number of columns
            references.length   // number of rows
        );

        const newState = {svg, chartGeom, cellDims, scales, samples}
        drawHeatMap(newState, this.props, this.infoRef);
        this.setState(newState); // may be async...
    }

    componentDidUpdate(prevProps) {
        if (prevProps.version !== this.props.version) {
            drawHeatMap(this.state, this.props, this.infoRef);
        }
    }
    render() {
        return (
            <div style={{...this.props.style}} ref={(r) => {this.boundingDOMref = r}}>
                <div {...chartTitleCSS}>{this.props.title}</div>
                <div
                    {...toolTipCSS}
                    style={{maxWidth: this.state.chartGeom.width/2}}
                    ref={(r) => {this.infoRef = r}}
                />
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

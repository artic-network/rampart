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


const drawHeatMap = ({names, referencePanel, data, svg, scales, cellDims, chartGeom, infoRef}) => {
    /* convert the refMatchPerSample data from raw counts to percentages & change to a d3-friendly struct.
    Input format:
      refMatchPerSample[sampleIdx][reference_idx] = INT
    Output data format:
      flat list, with each value itself a list:
        [sampleIdx, refPanelMatchIdx, fracIdentity]
    */



    const d3data = Array.from(new Array(names.length*referencePanel.length));

    let dataIdx = 0;
    for (let sampleIdx=0; sampleIdx<names.length; sampleIdx++) {
        for (let refIdx=0; refIdx<referencePanel.length; refIdx++) {
            d3data[dataIdx] = [
                sampleIdx,
                refIdx,
                data[names[sampleIdx]].refMatches[referencePanel[refIdx].name]
            ]
            dataIdx++;
        }
    }
    // /* NOTE scales.x(0) returns the far left pixel value of the cells, not the labels */

    /* remove the previous renderings... */
    svg.selectAll("*").remove();

    /* render the reference names (on the far left) */
    svg.selectAll(".refLabel")
        .data(referencePanel) /* get the labels */
        .enter()
        .append("text")
        .attr("class", "refLabel axis")
        .text((d) => d.name.length > 18 ? d.name.slice(0,17) + "..." : d.name) /* trim labels to 18 chars */
        .attr('y', (refName, refIdx) => scales.y(refIdx+1) + 0.5*cellDims.height)
        .attr('x', chartGeom.spaceLeft - 8 /* - cellDims.height */)
        .attr("text-anchor", "end")
        .attr("font-size", "12px")
        .attr("alignment-baseline", "middle"); /* i.e. y value specifies top of text */

    // svg.selectAll(".refColour")
    //     .data(references) /* get the labels */
    //     .enter()
    //     .append("rect")
    //     .attr("class", "refColour")
    //     .attr('width', cellDims.height)
    //     .attr('height', cellDims.height)
    //     .attr("x", chartGeom.spaceLeft - 4 - cellDims.height)
    //     .attr('y', (refName, refIdx) => scales.y(refIdx+1))
    //     .attr("fill", (refName, refIdx) => referenceDiscreteColours[refIdx]);

    /* render the column labels (barcodes) on the bottom */
    svg.selectAll(".sampleNames")
        .data(names)
        .enter()
        .append("text")
        .attr("class", "sampleNames axis")
        .text((name, idx) => idx + 1)
        .attr('x', (name, idx) => scales.x(idx) + 0.5*cellDims.width)
        .attr('y', chartGeom.height - chartGeom.spaceBottom + 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("alignment-baseline", "hanging");

    function handleMouseMove(d, i) {
        const [mouseX, mouseY] = mouse(this); // [x, y] x starts from left, y starts from top
        const left  = mouseX > 0.5 * scales.x.range()[1] ? "" : `${mouseX + 16}px`;
        const right = mouseX > 0.5 * scales.x.range()[1] ? `${scales.x.range()[1] - mouseX}px` : "";
        select(infoRef)
            .style("left", left)
            .style("right", right)
            .style("top", `${mouseY}px`)
            .style("visibility", "visible")
            .html(`
                Sample: ${names[d[0]]}
                <br/>
                ${parseFloat(d[2]).toFixed(2)}% reads map to ${referencePanel[d[1]].name}
            `);
    }
    function handleMouseOut() {
        select(infoRef).style("visibility", "hidden");
    }

    /* render the coloured cells of the heatmap */
    svg.selectAll(".heatCell")
        .data(d3data)
        .enter()
        .append("rect")
        .attr("class", "heatCell")
        .attr('width', cellDims.width)
        .attr('height', cellDims.height)
        .attr("x", d => scales.x(d[0]) + cellDims.padding)
        .attr("y", d => scales.y(d[1]+1) + cellDims.padding)
        .attr("fill", d => d[2] === 0 ? "#ccc" : heatColourScale(d[2]))
        .on("mouseout", handleMouseOut)
        .on("mousemove", handleMouseMove);

    /* render the legend (bottom) -- includes coloured cells & text */
    const legendDataValues = [0, 1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const legendBoxWidth = (chartGeom.width - chartGeom.spaceRight) / (legendDataValues.length -1);
    const legendBoxHeight = 12;
    const legendRoof = chartGeom.height - chartGeom.spaceBottom + 32;
    const legend = svg.selectAll(".legend")
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
        .attr("class", "axis")
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
    redraw() {
        /* currently redo everything, but we could make this much much smarter */
        const svg = select(this.DOMref);
        console.log(this.props.data)
        const names = Object.keys(this.props.data).filter((name) => name!=="all");
        const referencePanel = this.props.referencePanel;
        const chartGeom = this.state.chartGeom;
        const cellDims = calcCellDims(chartGeom, names.length, referencePanel.length);
        const scales = calcScales(
            chartGeom,
            names.length,           // number of columns
            referencePanel.length   // number of rows
        );
        drawHeatMap({
            names,
            referencePanel,
            data: this.props.data,
            svg,
            scales,
            cellDims,
            chartGeom,
            infoRef: this.infoRef
        });
    }
    componentDidMount() {
        const chartGeom = calcChartGeom(this.boundingDOMref.getBoundingClientRect());
        this.setState({chartGeom})
    }
    componentDidUpdate() {
        this.redraw();
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

import React from 'react';
import { select, mouse } from "d3-selection";
import { line, curveStep, area } from "d3-shape";
import {calcXScale, calcYScale, drawAxes} from "../utils/commonFunctions";
import {chartTitleCSS} from "../utils/commonStyles";
import {toolTipCSS} from "../utils/commonStyles";
import { max } from "d3-array";
import { genomeResolution } from "../magics";
import {color as d3color} from "d3-color";

const calculateSeries = (referenceMatchAcrossGenome, references) => {
    /* WHAT IS A SERIES?
    this is the data structure demanded by d3 for a stream graph.
    it is often produced by the d3.stack function - see https://github.com/d3/d3-shape/blob/master/README.md#_stack
    but it's faster to create this ourselves.

    THIS IS THE STRUCTURE:
      [x1, x2, ... xn] where n is the number of categorie (e.g. references)
        xi = [y1, y2, ..., ym] where m is the number of pivots (i.e. x points)
          yi = [z1, z2]: the (y0, y1) values of the category at that pivot point.

    /* Data -- referenceMatchAcrossGenome -- is [a][b] where
    a is array of reference panel genomes with counts of hits
    b is the genome regions (times by genomeResolution to get base pair) */
    const numXPoints = referenceMatchAcrossGenome[0].length;
    const series = references.map(() => Array.from(new Array(numXPoints), () => [0, 0]));
    // series = 11 x ~2000 x 2.     3-d array

    for (let xIdx=0; xIdx<numXPoints; xIdx++) {
        let yPosition = 0;
        let totalReadsHere = 0;
        for (let refIdx=0; refIdx<references.length; refIdx++) {
            totalReadsHere += referenceMatchAcrossGenome[refIdx][xIdx];
        }
        if (totalReadsHere > 10) { /* require >10 reads to calc stream */
            for (let refIdx=0; refIdx<references.length; refIdx++) {
                series[refIdx][xIdx][0] = yPosition;
                yPosition += referenceMatchAcrossGenome[refIdx][xIdx] / totalReadsHere;
                series[refIdx][xIdx][1] = yPosition;
            }
        }
    }
    return series;
}

const drawStream = (svg, scales, series, referenceLabels, referenceColours, infoRef) => {

    function handleMouseMove(d, i) {
        const [mouseX, mouseY] = mouse(this); // [x, y] x starts from left, y starts from top
        const left  = mouseX > 0.5 * scales.x.range()[1] ? "" : `${mouseX}px`;
        const right = mouseX > 0.5 * scales.x.range()[1] ? `${scales.x.range()[1] - mouseX}px` : "";
        select(infoRef)
            .style("left", left)
            .style("right", right)
            .style("top", `${mouseY}px`)
            .style("visibility", "visible")
            .html(`${referenceLabels[i].name}`);
//    .html(`${referenceLabels[i].name}<br />${referenceLabels[i].description}`);
    }
    function handleMouseOut() {
        select(infoRef).style("visibility", "hidden");
    }

    const areaObj = area()
        .x((d, i) => scales.x(i*genomeResolution))
        .y0((d) => scales.y(d[0]*100))
        .y1((d) => scales.y(d[1]*100));

    svg.append("g").selectAll(".stream")
        .data(series)
        .enter()
        .append("path")
        .attr("d", areaObj)
        .attr("fill", (d, i) => referenceColours[i])
        .attr("opacity", 1)
        .on("mouseout", handleMouseOut)
        .on("mousemove", handleMouseMove);
}

export const drawSteps = (svg, chartGeom, scales, data, colours, multiplier, fillIn) => {
    /* https://stackoverflow.com/questions/8689498/drawing-multiple-lines-in-d3-js */
    const makeLinePath = line()
        .x((d, i) => scales.x(i*multiplier))
        .y((d) => scales.y(d))
        .curve(curveStep);

    svg.selectAll(".coverageLine").remove();
    svg.selectAll(".coverageLine")
        .data(data)
        .enter().append("path")
        .attr("class", "coverageLine")
        .attr("fill", (d, i) => fillIn ? colours[i] : "none")
        .attr("stroke", (d, i) => fillIn ? d3color(colours[i]).darker(2) : colours[i])
        .attr('d', makeLinePath);
}

/* draw the genes (annotations) */
const drawGenomeAnnotation = (svg, chartGeom, scales, annotation) => {
    // svg.selectAll(".gene").remove(); /* only added once, don't need to remove what's not there */

    const amplicons = annotation.amplicons;
    const ampliconRoof = chartGeom.height - chartGeom.spaceBottom + 20; /* all primers & genes below this */
    const ampliconHeight = 8;
    if (amplicons) {
        svg.append("g")
            .attr("id", "amplicons")
            .selectAll(".amplicon")
            .data(amplicons)
            .enter()
            .append("rect")
            .attr("class", "primer")
            .attr("x", (d) => scales.x(d[0]))
            .attr("y", (d, i) => i%2 ? ampliconRoof : ampliconRoof+ampliconHeight)
            .attr("width", (d) => scales.x(d[1])-scales.x(d[0]))
            .attr("height", ampliconHeight)
            .style("fill", "lightgray")
            .style("stroke", "none");
    }

    const geneHeight = 15;
    const geneRoof = ampliconRoof + 2*ampliconHeight + 5;
    const calcYOfGene = (name) => genes[name].strand === 1 ? geneRoof : geneRoof+geneHeight;

    const genes = annotation.genes
    const geneNames = Object.keys(annotation.genes);

    const genesSel = svg.selectAll(".gene")
        .data(geneNames)
        .enter()
        .append("g");

    genesSel.append("rect")
        .attr("class", "gene")
        .attr("x", (name) => scales.x(genes[name].start))
        .attr("y", calcYOfGene)
        .attr("width", (name) => scales.x(genes[name].end) - scales.x(genes[name].start))
        .attr("height", geneHeight)
        .style("fill", "none")
        .style("stroke", "gray");

    /* https://bl.ocks.org/emmasaunders/0016ee0a2cab25a643ee9bd4855d3464 for text attr values */
    genesSel.append("text")
        .attr("x", (name) => scales.x(genes[name].start) + (scales.x(genes[name].end) - scales.x(genes[name].start))/2)
        .attr("y", calcYOfGene)
        .attr("dy", "2px") /* positive values bump down text */
        .attr("text-anchor", "middle") /* centered horizontally */
        .attr("font-size", "10px")
        .attr("alignment-baseline", "hanging") /* i.e. y value specifies top of text */
        .style("fill", "black")
        .text((name) => name.length > 3 ? "" : name);
};


/* given the DOM dimensions of the chart container, calculate the chart geometry (used by the SVG & D3) */
const calcChartGeom = (DOMRect) => ({
    width: DOMRect.width,
    height: DOMRect.height - 20, // title line
    spaceLeft: 60,
    spaceRight: 0,
    spaceBottom: 60,
    spaceTop: 10
});

const getMaxCoverage = (coverage) => {
    const trueMax = max(coverage.map((d) => max(d)));
    return (parseInt(trueMax / 50, 10) + 1) * 50;
}


class CoveragePlot extends React.Component {
    constructor(props) {
        super(props);
        this.state = {chartGeom: {}, showReferenceMatches: false, logScale: false};
        this.toggleReadDepthVsReferenceMatches = () => {
            this.setState({showReferenceMatches: !this.state.showReferenceMatches})
        }
        this.handleKeyDown = (event) => {
            switch(event.keyCode) {
                case 76: // key: "l"
                    this.setState({logScale: !this.state.logScale})
                    break;
                default:
                    break;
            }
        }
    }
    componentWillMount() {
        document.addEventListener("keydown", this.handleKeyDown);
    }
    componentDidMount() {
        const svg = select(this.DOMref);
        const chartGeom = calcChartGeom(this.boundingDOMref.getBoundingClientRect());
        const xScale = calcXScale(chartGeom, this.props.annotation.genome.length);
        this.setState({svg, chartGeom, xScale}); /* will trigger componentDidUpdate */
    }
    componentDidUpdate(prevProps) {
        this.state.svg.selectAll("*").remove();
        /* compute the y-scale */
        const yScale = this.state.showReferenceMatches ?
            calcYScale(this.state.chartGeom, 100) :
            calcYScale(this.state.chartGeom, getMaxCoverage(this.props.coverage), {log: this.state.logScale});
        const scales = {x: this.state.xScale, y: yScale};
        /* draw the axes & genome annotation*/
        const ySuffix = this.state.showReferenceMatches ? "%" : "x";
        drawAxes(this.state.svg, this.state.chartGeom, scales, {xSuffix: "bp", ySuffix});
        drawGenomeAnnotation(this.state.svg, this.state.chartGeom, scales, this.props.annotation);
        /* fill in the graph! */
        if (this.state.showReferenceMatches) {
            const series = calculateSeries(this.props.referenceMatchAcrossGenome, this.props.references)
            drawStream(this.state.svg, scales, series, this.props.references, this.props.referenceColours, this.infoRef);
        } else {
            drawSteps(this.state.svg, this.state.chartGeom, scales, this.props.coverage, this.props.colours, genomeResolution, this.props.showReferenceMatches);
        }
    }

    renderTitle() {
        if (!this.props.showReferenceMatches) {
            return (<div {...chartTitleCSS}>Read Depth</div>)
        }
        return (
            <div style={{margin: "0 auto", width: "50%"}}>
                <span style={{paddingRight: "10px"}}>Depth</span>
                <label className="switch">
                    <input type="checkbox" onClick={this.toggleReadDepthVsReferenceMatches}/>
                    <span className="slider round"/>
                </label>
                <span style={{paddingLeft: "10px"}}>References</span>
            </div>
        )
    }

    render() {
        return (
            <div style={{...this.props.style}} ref={(r) => {this.boundingDOMref = r}}>
                {this.renderTitle()}
                <div {...toolTipCSS} ref={(r) => {this.infoRef = r}}/>
                <svg
                    ref={(r) => {this.DOMref = r}}
                    height={this.state.chartGeom.height || 0}
                    width={this.state.chartGeom.width || 0}
                />
            </div>
        )
    }
}

export default CoveragePlot;

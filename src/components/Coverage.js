import React from 'react';
import { select } from "d3-selection";
import {calcXScale, calcYScale, drawAxes} from "../utils/commonFunctions";
import { max } from "d3-array";
import { drawSteps } from "../d3/drawSteps";
import { drawGenomeAnnotation } from "../d3/genomeAnnotation";
import { drawStream } from "../d3/stream";
import Toggle from "./toggle";

/* given the DOM dimensions of the chart container, calculate the chart geometry (used by the SVG & D3) */
const calcChartGeom = (DOMRect) => ({
    width: DOMRect.width,
    height: DOMRect.height - 20, // title line
    spaceLeft: 60,
    spaceRight: 0,
    spaceBottom: 60,
    spaceTop: 10
});

const getMaxCoverage = (data) => {
    const trueMax = max(Object.keys(data).map((name) => data[name].maxCoverage));
    return (parseInt(trueMax / 50, 10) + 1) * 50;
}

class CoveragePlot extends React.Component {
    constructor(props) {
        super(props);
        this.state = {chartGeom: {}, showReferenceMatches: false, logScale: false};
        this.toggleReadDepthVsReferenceMatches = () => {
            this.setState({showReferenceMatches: !this.state.showReferenceMatches})
        }
    }
    redraw () {
        this.state.svg.selectAll("*").remove();
        const xScale = calcXScale(this.state.chartGeom, this.props.reference.length);
        const yScale = this.state.showReferenceMatches ?
            calcYScale(this.state.chartGeom, 100) :
            calcYScale(this.state.chartGeom, getMaxCoverage(this.props.coverage), {log: this.props.viewOptions.logYAxis});
        const scales = {x: xScale, y: yScale};
        /* draw the axes & genome annotation*/
        const ySuffix = this.state.showReferenceMatches ? "%" : "x";
        drawAxes(this.state.svg, this.state.chartGeom, scales, {xSuffix: "bp", ySuffix});
        drawGenomeAnnotation(this.state.svg, this.state.chartGeom, scales, this.props.reference, this.state.hoverSelection);
        if (this.state.showReferenceMatches) {
          drawStream({
            svg: this.state.svg,
            scales,
            stream: this.props.referenceStream,
            referencePanelNames: this.props.referencePanelNames,
            referenceColours: this.props.viewOptions.referenceColours,
            hoverSelection: this.state.hoverSelection,
            genomeResolution: this.props.viewOptions.genomeResolution
          }); 
        } else {
            const data = Object.keys(this.props.coverage)
                .filter((name) => name!=="all")
                .map((name) => ({
                    name,
                    xyValues: this.props.coverage[name].coverage.map((cov, idx) => [idx*this.props.viewOptions.genomeResolution, cov]),
                    colour: this.props.viewOptions.sampleColours[name]
                }));
            const hoverDisplayFunc = ({name, xValue, yValue}) => (`Sample: ${name}<br/>Pos: ${xValue}<br/>Depth: ${yValue}x`);

            drawSteps({
                svg: this.state.svg,
                chartGeom: this.state.chartGeom,
                scales,
                data,
                fillBelowLine: !!this.props.fillIn,
                hoverSelection: this.state.hoverSelection,
                hoverDisplayFunc
            });
        }
    }
    componentDidMount() {
        const svg = select(this.DOMref);
        const chartGeom = calcChartGeom(this.boundingDOMref.getBoundingClientRect());
        const hoverWidth = parseInt(chartGeom.width * 3/4, 10);
        const hoverSelection = select(this.infoRef);
        this.setState({svg, chartGeom, hoverWidth, hoverSelection});
    }
    componentDidUpdate() {
        if (this.props.viewOptions.genomeResolution) {
            this.redraw();
        }
    }
    render() {
        return (
            <div className={this.props.className} style={{width: this.props.width}} ref={(r) => {this.boundingDOMref = r}}>
                { !this.props.canShowReferenceMatches ? (
                    <div className="chartTitle">
                        Read Depth
                    </div>
                ) : (
                    <div className="centerHorizontally">
                        <Toggle
                            labelLeft="depth"
                            labelRight="references"
                            handleToggle={this.toggleReadDepthVsReferenceMatches}
                            toggleOn={false}
                        />
                    </div>
                )}
                <div className="hoverInfo" style={{maxWidth: this.state.hoverWidth || 0}} ref={(r) => {this.infoRef = r}}/>
                <svg
                    ref={(r) => {this.DOMref = r}}
                    height={this.state.chartGeom.height || 0}
                    width={this.state.chartGeom.width || 0}
                />
                {this.props.renderProp ? this.props.renderProp : null}
            </div>
        )
    }
}

export default CoveragePlot;

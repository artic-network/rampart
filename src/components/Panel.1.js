import React from 'react';
import { css } from 'glamor'
import CoveragePlot from "./Coverage";
import ReadLengthDistribution from "./ReadLengthDistribution";
import CoverageOverTime from "./CoverageOverTime";
import {select} from "d3-selection";
import {consensusCoverage, okCoverage} from "../magics";
import {heatColourScale} from "../utils/colours";

const panelContainerCollapsed = {
    position: "relative",
    width: "98%",
    height: "30px", // collapsed
    minHeight: "30px", // collapsed
    margin: "10px 10px 10px 10px",
    transition: "height 0.5s ease-out",
    WebkitTransition: "height 0.5s ease-out",
    border: "1px solid gray",
    borderRadius: "5px",
    borderLeft: "5px solid gray",
}

const panelContainerExpanded = {
    ...panelContainerCollapsed,
    height: "350px",
    minHeight: "350px",
}

const flexRowContainer = css({
    display: "flex",
    'flexDirection': 'row',
    justifyContent: 'space-between',
    height: "calc(100% - 25px)"
})

export const panelTitle = css({
    "fontWeight": "bold",
    "fontSize": "1.3em",
    "paddingLeft": "20px",
    flexBasis: "15%"
})

export const panelText = css({
    "fontWeight": "bold",
    "fontSize": "1.0em",
    "paddingLeft": "20px",
    flexBasis: "35%"
})

const headerCSS = css({
    display: "flex",
    flexDirection: "row",
    cursor: "pointer"
})

const renderCoverageHeatmap = (domRef, coverage) => {
    const selection = select(domRef);
    const dimensions = selection.node().getBoundingClientRect()
    const pxPerColumn = 3;
    const nIntervals = Math.ceil(dimensions.width/pxPerColumn);
    const eachInterval = coverage.length / nIntervals;
    const columnIdxs = Array.from(new Array(nIntervals), (_, i) => Math.floor(i*eachInterval));
    const colourCoverage = (d) => {
        const depth = coverage[d];
        return depth > consensusCoverage ? heatColourScale(100) :
            depth > okCoverage ? heatColourScale(70) :
                depth > 10 ? heatColourScale(20) :
                    depth > 0 ? heatColourScale(1) :
                    "#ccc";
    }

    selection
        .selectAll("*")
        .remove();
    selection
        .selectAll(".coverageCell")
        .data(columnIdxs)
        .enter().append("rect")
        .attr("class", "coverageCell")
        .attr('width', pxPerColumn)
        .attr('height', dimensions.height)
        .attr("x", (d, i) => pxPerColumn*i)
        .attr("y", 3)
        .attr("fill", colourCoverage);
}


class Panel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            expanded: false
        }
    }
    renderNoDataHeader() {
        return (
            <div {...panelTitle}>
                {`#${this.props.sampleIdx} (${this.props.name}).
        has no reads (yet)`}
            </div>
        )
    }
    renderHeader() {
        const summaryTitle = `${this.props.name}`;
        const summaryText = `${this.props.data.demuxedCount} reads demuxed, ${this.props.data.mappedCount} mapped.`;

        return (
            <div {...headerCSS} onClick={() => this.setState({expanded: !this.state.expanded})}>
                <span {...panelTitle}>
                  {summaryTitle}
                </span>
                <span {...panelText}>
                  {summaryText}
                </span>
                {
                    this.props.readCount > 0 ? (
                        <span style={{position: "absolute", top: "10px", right: "10px"}}>
                            {this.state.expanded ? "click to contract" : "click to expand"}
                        </span>
                    ) : null
                }
            </div>
        );
        

        // `${name}: ${props.data[name].demuxedCount} reads demuxed, ${props.data[name].mappedCount} mapped.`


        // const latestCoverageData = this.props.coverageOverTime[this.props.coverageOverTime.length-1];
        // let summaryTitle = `${this.props.sampleIdx + 1} – ${this.props.name}`;
        // let summaryText = `${this.props.readCount} reads.`;
        // if (this.props.readCount) {
        //     summaryText += ` ${latestCoverageData[1]}% > 1000x, ${latestCoverageData[2]}% > 100x, ${latestCoverageData[3]}% > 10x coverage.`;
        // }

        // return (
        //     <div
        //         {...headerCSS}
        //         onClick={() => this.setState({expanded: !this.state.expanded})}
        //     >
        //         <span {...panelTitle}>
        //           {summaryTitle}
        //         </span>
        //         <span {...panelText}>
        //           {summaryText}
        //         </span>

        //         {this.state.expanded || this.props.readCount===0 ? null : (
        //             <span style={{flexBasis: "30%"}}>
        //                 <svg width={300} height={25} ref={(r) => {this.coverageHeaderRef = r}}>
        //                 </svg>
        //             </span>
        //         )}

        //         {this.props.readCount > 0 ? (
        //             <span style={{position: "absolute", top: "10px", right: "10px"}}>
        //                 {this.state.expanded ? "click to contract" : "click to expand"}
        //             </span>
        //         ) : null}
        //     </div>
        // )
    }
    renderCoverage() {
      return (
        <CoveragePlot
          style={{width: '45%', margin: 'auto', height: "100%", position: "relative"}}
          showReferenceMatches={true}
          coverage={[this.props.coverage]}
          references={this.props.references}
          referenceMatchAcrossGenome={this.props.referenceMatchAcrossGenome}
          annotation={this.props.annotation}
          version={this.props.version}
          colours={[this.props.colour]}
          referenceColours={this.props.referenceColours}
          viewOptions={this.props.viewOptions}
        />
      )
    }
    renderReadLengthDistribution() {
      return (
        <ReadLengthDistribution
          style={{width: '20%', margin: 'auto', height: "100%"}}
          title={"Read Lengths"}
          readLength={this.props.readLength}
          version={this.props.version}
          colour={this.props.colour}
          viewOptions={this.props.viewOptions}
        />
      )
    }
    renderCoverageOverTime() {
      return (
        <CoverageOverTime
          style={{width: '30%', margin: 'auto', height: "100%"}}
          title={"Coverage Progress"}
          coverageOverTime={this.props.coverageOverTime}
          version={this.props.version}
          colour={this.props.colour}
          sampleIdx={this.props.sampleIdx}
          numSamples={this.props.numSamples}
          viewOptions={this.props.viewOptions}
        />
      )
    }
    renderPanels() {
      return (
        <div {...flexRowContainer}>
          {this.renderCoverage()}
          {/* {this.renderReadLengthDistribution()} */}
          {/* {this.renderCoverageOverTime()} */}
        </div>
      )
    }
    componentDidMount() {
        if (!this.state.expanded && this.props.readCount > 0) {
            renderCoverageHeatmap(this.coverageHeaderRef, this.props.coverage);
        }
    }
    componentDidUpdate() {
        if (!this.state.expanded && this.props.readCount > 0) {
            renderCoverageHeatmap(this.coverageHeaderRef, this.props.coverage);
        }
    }
    render() {
        let panelStyles = { ...(this.state.expanded ? panelContainerExpanded : panelContainerCollapsed), ...{ borderColor: this.props.colour} };
        return (
            <div style={panelStyles}>
                {this.renderHeader()}
                {this.state.expanded ? this.renderPanels() : null}
            </div>
        )
    }
}

export default Panel;

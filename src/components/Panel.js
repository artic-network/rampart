import React from 'react';
import { css } from 'glamor'
import CoveragePlot from "./Coverage";
import ReadLengthDistribution from "./ReadLengthDistribution";
import {sampleColours} from "../utils/commonStyles";
import {renderCoverageHeatmap} from "../utils/d3_panelHeaderCoverage";
import CoverageOverTime from "./CoverageOverTime";

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
  flexBasis: "50%"
})

const headerCSS = css({
  display: "flex",
  flexDirection: "row",
  cursor: "pointer"
})


class Panel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: true,
      colour: sampleColours[props.sampleIdx]
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
    const latestCoverageData = this.props.coverageOverTime[this.props.coverageOverTime.length-1];
    let summaryText = `${this.props.name}. ${this.props.readCount} reads.`;
    if (this.props.readCount) {
      summaryText += ` ${latestCoverageData[1]}% > 1000x, ${latestCoverageData[2]}% > 100x, ${latestCoverageData[3]}% > 10x coverage.`;
    }

    return (
      <div
        {...headerCSS}
        onClick={() => this.setState({expanded: !this.state.expanded})}
      >
        <span {...panelTitle}>
          {summaryText}
        </span>

        {this.state.expanded || this.props.readCount===0 ? null : (
          <span style={{flexBasis: "30%"}}>
            <svg width={300} height={25} ref={(r) => {this.coverageHeaderRef = r}}>
            </svg>
          </span>
        )}

        {this.props.readCount > 0 ? (
          <span style={{position: "absolute", top: "10px", right: "10px"}}>
            {this.state.expanded ? "click to contract" : "click to expand"}
          </span>
        ) : null}
      </div>
    )
  }
  renderPanels() {
    return (
      <div {...flexRowContainer}>
        <CoveragePlot
          style={{width: '45%', margin: 'auto', height: "100%"}}
          showReferenceMatches={true}
          coverage={[this.props.coverage]}
          references={this.props.references}
          referenceMatchAcrossGenome={this.props.referenceMatchAcrossGenome}
          annotation={this.props.annotation}
          version={this.props.version}
          colours={[this.state.colour]}
        />
        <ReadLengthDistribution
          style={{width: '20%', margin: 'auto', height: "100%"}}
          title={"Read Lengths"}
          readLength={this.props.readLength}
          version={this.props.version}
          colour={this.state.colour}
        />
        <CoverageOverTime
          style={{width: '30%', margin: 'auto', height: "100%"}}
          title={"Coverage Progress"}
          coverageOverTime={this.props.coverageOverTime}
          version={this.props.version}
          colour={this.state.colour}
        />

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
    if (this.props.sampleIdx === 1) {
      // console.log("this.props", this.props)

    }
    let panelStyles = { ...(this.state.expanded ? panelContainerExpanded : panelContainerCollapsed), ...{ borderColor: this.state.colour} };
    const anyData = !!this.props.readLength.length;
    if (anyData) {
      return (
        <div style={panelStyles}>
          {this.renderHeader()}
          {this.state.expanded ? this.renderPanels() : null}
        </div>
      )
    }
    /* else there's no data... */
    return (
      <div style={panelStyles}>
        {this.renderNoDataHeader()}
      </div>
    )
  }
}

export default Panel;

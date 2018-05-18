import React from 'react';
import { css } from 'glamor'
import {calcScales, drawAxes, drawRefChart} from "../utils/constructChart";
import {drawCurve, drawCoverage} from "../utils/coverage";
import { select } from "d3-selection";
import { getHistogramMaxes, getMaxNumReadsForRefs } from "../utils/manipulateReads.js"


const panelContainerCollapsed = {
  position: "relative",
  width: "98%",
  height: "50px", // collapsed
  minHeight: "50px", // collapsed
  // backgroundColor: "orange",
  margin: "10px 10px 10px 10px",
  transition: "height 0.5s ease-out",
  "-webkit-transition": "height 0.5s ease-out",
  border: "1px solid gray",
}

const panelContainerExpanded = {
  ...panelContainerCollapsed,
  height: "300px",
  minHeight: "300px",
  // backgroundColor: "blue"
}

const ExpandToggle = ({open, callback}) => (
  <div style={{position: "absolute", top: "10px", right: "10px", cursor: "pointer"}} onClick={callback}>
    {open ? "contract" : "expand"}
  </div>
)
//
//
export const outerStyles = css({
  width: 'calc(100% - 30px)',
  height: "300px",
  minHeight: "300px", // TODO
  boxShadow: '0px 2px rgba(0, 0, 0, 0.14) inset',
  margin: "10px 10px 10px 10px"
})

export const flexRowContainer = css({
  display: "flex",
  'flexDirection': 'row',
  justifyContent: 'space-between',
  height: "calc(100% - 25px)"
})

const panelElement = css({
  width: '25%',
  margin: 'auto',
  height: "100%"
})

export const chartTitle = css({
  "fontWeight": "bold",
  "fontSize": "1em"
})

export const panelTitle = css({
  "fontWeight": "bold",
  "fontSize": "1.3em"
})

// const resetStyle = css({
//   backgroundColor: 'rgba(0, 0, 0, 0.15)',
//   borderRadius: 4,
//   fontFamily: "lato",
//   fontWeight: "bold",
//   float: "right"
// })
//
const chartGeom = {
  width: 300,
  height: 200,
  spaceLeft: 40,
  spaceRight: 10,
  spaceBottom: 20,
  spaceTop: 10
};

class Panel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false
    }
    this.coverageDOMRef = undefined;
    this.readLengthDOMRef = undefined;
    this.refMatchDOMRef = undefined;
  }
  componentDidMount() {
  }
  componentDidUpdate(prevProps) {
    if (this.state.expanded) {
      /* create the scales */
      /* coverage */
      const coverageMaxes = getHistogramMaxes(this.props.coverage)
      const coverageSVG = select(this.coverageDOMRef)
      const coverageScales = calcScales(chartGeom, coverageMaxes.x, coverageMaxes.y)
      /* read length */
      const readLengthMaxes = getHistogramMaxes(this.props.readLength)
      const readLengthSVG = select(this.readLengthDOMRef)
      const readLengthScales = calcScales(chartGeom, readLengthMaxes.x, readLengthMaxes.y)
      /* reference match */
      const refMatchSVG = select(this.refMatchDOMRef)
      const refMatchMax = getMaxNumReadsForRefs(this.props.refMatch)
      const refMatchScales = calcScales(chartGeom, refMatchMax, this.props.refMatch.length)
      /* note: refMatch scales: x is num reads, y is num references */

      /* draw coverage graph */
      drawAxes(coverageSVG, chartGeom, coverageScales)
      drawCoverage(coverageSVG, chartGeom, coverageScales, [this.props.coverage], ["black"])

      /* draw read length distribution graph */
      drawAxes(readLengthSVG, chartGeom, readLengthScales)
      drawCurve(readLengthSVG, chartGeom, readLengthScales, [this.props.readLength], ["black"])

      /* draw read length distribution graph */
      drawAxes(refMatchSVG, chartGeom, refMatchScales)
      drawRefChart(refMatchSVG, chartGeom, refMatchScales, this.props.refMatch)
    }
  }
  render() {
    return (
      <div style={this.state.expanded ? panelContainerExpanded : panelContainerCollapsed}>
        <ExpandToggle open={this.state.expanded} callback={() => this.setState({expanded: !this.state.expanded})}/>
        <div {...panelTitle}>
          {`Channel ${this.props.channelNumber} (todo: name here).
          ${this.props.reads.size()} reads.
          100x coverage.
          Status: huh?!?
          `}
        </div>
        {this.state.expanded ? (
          <div {...flexRowContainer}>
            <div {...panelElement}>
              <div {...chartTitle}>{"coverage"}</div>
              <svg ref={(r) => {this.coverageDOMRef = r}} height={chartGeom.height} width={chartGeom.width}/>
            </div>
            <div {...panelElement}>
              <div {...chartTitle}>{"read length"}</div>
              <svg ref={(r) => {this.readLengthDOMRef = r}}  height={chartGeom.height} width={chartGeom.width}/>
            </div>
            <div {...panelElement}>
              <div {...chartTitle}>{"reference"}</div>
              <svg ref={(r) => {this.refMatchDOMRef = r}} height={chartGeom.height} width={chartGeom.width}/>
            </div>
          </div>
        ) : null}
      </div>
    )
  }
}

export default Panel;

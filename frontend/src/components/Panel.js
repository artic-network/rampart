import React from 'react';
import { css } from 'glamor'
import {calcScales, drawAxes, drawBarChart, drawRefChart} from "../utils/constructChart";
import { select } from "d3-selection";
import { getHistogramMaxes, getMaxNumReadsForRefs } from "../utils/manipulateReads.js"

export const outerStyles = css({
  width: '100%',
  margin: 'auto',
  minHeight: "400px", // TODO
  boxShadow: '0px 2px rgba(0, 0, 0, 0.14) inset'
})

export const flexRowContainer = css({
  display: "flex",
  'flexDirection': 'row',
  justifyContent: 'space-between'
})

const panelElement = css({
  width: '33%',
  margin: 'auto'
})

export const chartTitle = css({
  "fontWeight": "bold",
  "fontSize": "1em"
})

export const panelTitle = css({
  "fontWeight": "bold",
  "fontSize": "1.3em"
})

const resetStyle = css({
  backgroundColor: 'rgba(0, 0, 0, 0.15)',
  borderRadius: 4,
  fontFamily: "lato",
  fontWeight: "bold",
  float: "right"
})

const chartGeom = {
  width: 500,
  height: 300,
  spaceLeft: 40,
  spaceRight: 10,
  spaceBottom: 20,
  spaceTop: 10
};

class Panel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      coverageScales: undefined,
      readLengthScales: undefined,
      refMatchScales: undefined
    }
    this.coverageDOMRef = undefined;
    this.readLengthDOMRef = undefined;
    this.refMatchDOMRef = undefined;
  }
  componentDidMount() {
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
    drawBarChart(coverageSVG, chartGeom, coverageScales, this.props.coverage)

    /* draw read length distribution graph */
    drawAxes(readLengthSVG, chartGeom, readLengthScales)
    drawBarChart(readLengthSVG, chartGeom, readLengthScales, this.props.readLength)

    /* draw read length distribution graph */
    drawAxes(refMatchSVG, chartGeom, refMatchScales)
    drawRefChart(refMatchSVG, chartGeom, refMatchScales, this.props.refMatch)

    this.setState({
      coverageScales,
      readLengthScales,
      refMatchScales
    })

  }
  componentDidUpdate(prevProps) {
    if (prevProps.version !== this.props.version) {
      // console.time("CDU for channel ", this.state.channelNumber)
      const coverageSVG = select(this.coverageDOMRef)
      const readLengthSVG = select(this.readLengthDOMRef)
      const refMatchSVG = select(this.refMatchDOMRef)
      const newState = {};
      /* do scales need updating? */
      const coverageMaxes = getHistogramMaxes(this.props.coverage)
      if (coverageMaxes.x !== this.state.coverageScales.x.domain()[1] ||
        coverageMaxes.y !== this.state.coverageScales.y.domain()[1]) {
        newState.coverageScales = calcScales(chartGeom, coverageMaxes.x, coverageMaxes.y)
        drawAxes(coverageSVG, chartGeom, newState.coverageScales)
      } else {
        newState.coverageScales = this.state.coverageScales;
      }

      const readLengthMaxes = getHistogramMaxes(this.props.readLength)
      if (readLengthMaxes.x !== this.state.readLengthScales.x.domain()[1] ||
        readLengthMaxes.y !== this.state.readLengthScales.y.domain()[1]) {
        newState.readLengthScales = calcScales(chartGeom, readLengthMaxes.x, readLengthMaxes.y)
        drawAxes(readLengthSVG, chartGeom, newState.readLengthScales)
      } else {
        newState.readLengthScales = this.state.readLengthScales
      }

      const refMatchMax = getMaxNumReadsForRefs(this.props.refMatch)
      if (readLengthMaxes.x !== this.state.refMatchScales.x.domain()[1]) {
        newState.refMatchScales = calcScales(chartGeom, refMatchMax, this.props.refMatch.length)
        drawAxes(refMatchSVG, chartGeom, newState.refMatchScales)
      } else {
        newState.refMatchScales = this.state.refMatchScales
      }

      /* draw data (it must have updated) */
      drawBarChart(coverageSVG, chartGeom, newState.coverageScales, this.props.coverage)
      drawBarChart(readLengthSVG, chartGeom, newState.readLengthScales, this.props.readLength)
      drawRefChart(refMatchSVG, chartGeom, newState.refMatchScales, this.props.refMatch)

      this.setState(newState)
      // console.timeEnd("CDU for channel ", this.state.channelNumber)
    }
  }

  render() {
    // <button {...resetStyle} onClick={() => {console.log("reset filters")}}>
    //   reset filters
    // </button>
    return (
      <div {...outerStyles}>
        <div {...flexRowContainer}>
          <div {...panelTitle}>
            {`Channel ${this.props.channelNumber} (array idx ${this.props.channelNumber-1}),
            ${this.props.reads.size()} reads.
            `}
          </div>

        </div>
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
      </div>
    )

  }
}

export default Panel;

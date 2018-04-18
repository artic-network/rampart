import crossfilter from "crossfilter"
import React from 'react';
import { css } from 'glamor'
import {calcScales, drawAxes, drawBarChart, drawRefChart} from "../utils/constructChart";
import { select } from "d3-selection";
import { getHistogramMaxes, getMaxNumReadsForRefs } from "../utils/manipulateReads.js"

const outerStyles = css({
  width: '100%',
  margin: 'auto',
  minHeight: "400px", // TODO
  boxShadow: '0px 2px rgba(0, 0, 0, 0.14) inset'
})

const flexRowContainer = css({
  display: "flex",
  'flexDirection': 'row',
  justifyContent: 'space-between'
})

const panelElement = css({
  width: '33%',
  margin: 'auto'
})

const chartTitle = css({
  "fontWeight": "bold",
  "fontSize": "1em"
})

const panelTitle = css({
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
      reads: undefined,
      nReads: undefined,
      coverageData: undefined,
      readLengthData: undefined,
      coverageScales: undefined,
      readLengthScales: undefined,
      refMatchData: undefined,
      refMatchScales: undefined,
      startTime: Date.now()
    }
    this.coverageDOMRef = undefined;
    this.readLengthDOMRef = undefined;
    this.refMatchDOMRef = undefined;
  }
  componentDidMount() {
    const reads = crossfilter(this.props.data)
    const nReads = reads.size();
    /* we need to create dimensions / groups for each of the graphs.
    This only needs to be done once - it automagically updates! */
    const coverageData = reads
      .dimension((d) => d.location)
      .group((d) => Math.ceil(d/100)*100) /* this makes a histogram with x values (bases) rounded to closest 100 */
      .all();
    const readLengthData = reads
      .dimension((d) => d.length)
      .group((d) => Math.ceil(d/10)*10) /* this makes a histogram with x values (bases) rounded to closest 10 */
      .all();
    const refMatchData = reads
      .dimension((d) => d.reference)
      .group((d) => d)
      .all();
    console.log(refMatchData)

    /* create the scales */
    /* coverage */
    const coverageMaxes = getHistogramMaxes(coverageData)
    const coverageSVG = select(this.coverageDOMRef)
    const coverageScales = calcScales(chartGeom, coverageMaxes.x, coverageMaxes.y)
    /* read length */
    const readLengthMaxes = getHistogramMaxes(readLengthData)
    const readLengthSVG = select(this.readLengthDOMRef)
    const readLengthScales = calcScales(chartGeom, readLengthMaxes.x, readLengthMaxes.y)
    /* reference match */
    const refMatchSVG = select(this.refMatchDOMRef)
    const refMatchMax = getMaxNumReadsForRefs(refMatchData)
    const refMatchScales = calcScales(chartGeom, refMatchMax, refMatchData.length)
    /* note: refMatch scales: x is num reads, y is num references */

    /* draw coverage graph */
    drawAxes(coverageSVG, chartGeom, coverageScales)
    drawBarChart(coverageSVG, chartGeom, coverageScales, coverageData)

    /* draw read length distribution graph */
    drawAxes(readLengthSVG, chartGeom, readLengthScales)
    drawBarChart(readLengthSVG, chartGeom, readLengthScales, readLengthData)

    /* draw read length distribution graph */
    drawAxes(refMatchSVG, chartGeom, refMatchScales)
    drawRefChart(refMatchSVG, chartGeom, refMatchScales, refMatchData)

    console.log(refMatchScales.x.domain(), refMatchScales.y.domain(), refMatchData)


    this.setState({
      reads,
      nReads,
      coverageData,
      readLengthData,
      coverageScales,
      readLengthScales,
      refMatchData,
      refMatchScales
    })

  }
  componentDidUpdate(prevProps) {
    if (prevProps.version !== this.props.version) {
      console.log("VERSION", this.props.version)
      console.time("CDU")
      const newState = {
        reads: this.state.reads,
      }
      newState.reads.add(this.props.data.slice(prevProps.data.length, this.props.data.length))
      /* note that this.state.coverageData has magically been updated now! */
      newState.nReads = newState.reads.size()

      const coverageSVG = select(this.coverageDOMRef)
      const readLengthSVG = select(this.readLengthDOMRef)
      const refMatchSVG = select(this.refMatchDOMRef)

      /* do scales need updating? */
      const coverageMaxes = getHistogramMaxes(this.state.coverageData)
      if (coverageMaxes.x !== this.state.coverageScales.x.domain()[1] ||
        coverageMaxes.y !== this.state.coverageScales.y.domain()[1]) {
        newState.coverageScales = calcScales(chartGeom, coverageMaxes.x, coverageMaxes.y)
        drawAxes(coverageSVG, chartGeom, newState.coverageScales)
      } else {
        newState.coverageScales = this.state.coverageScales
      }

      const readLengthMaxes = getHistogramMaxes(this.state.readLengthData)
      if (readLengthMaxes.x !== this.state.readLengthScales.x.domain()[1] ||
        readLengthMaxes.y !== this.state.readLengthScales.y.domain()[1]) {
        newState.readLengthScales = calcScales(chartGeom, readLengthMaxes.x, readLengthMaxes.y)
        drawAxes(readLengthSVG, chartGeom, newState.readLengthScales)
      } else {
        newState.readLengthScales = this.state.readLengthScales
      }

      const refMatchMax = getMaxNumReadsForRefs(this.state.refMatchData)
      if (readLengthMaxes.x !== this.state.refMatchScales.x.domain()[1]) {
        newState.refMatchScales = calcScales(chartGeom, refMatchMax, this.state.refMatchData.length)
        drawAxes(refMatchSVG, chartGeom, newState.refMatchScales)
      } else {
        newState.refMatchScales = this.state.refMatchScales
      }

      /* draw data (it must have updated) */
      drawBarChart(coverageSVG, chartGeom, newState.coverageScales, this.state.coverageData)
      drawBarChart(readLengthSVG, chartGeom, newState.readLengthScales, this.state.readLengthData)
      drawRefChart(refMatchSVG, chartGeom, newState.refMatchScales, this.state.refMatchData)

      this.setState(newState)
      console.timeEnd("CDU")
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
            {`${this.props.info}.
            Total reads: ${this.state.nReads}.
            Time elapsed: ${parseInt((Date.now() - this.state.startTime) / 1000, 10)}s.
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

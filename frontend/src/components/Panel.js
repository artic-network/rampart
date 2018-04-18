import crossfilter from "crossfilter"
import React from 'react';
import { css } from 'glamor'
import {calcScales, drawAxes, drawBarChart} from "../utils/constructChart";
import { select } from "d3-selection";
import { getCoverageMaxes } from "../utils/manipulateReads.js"

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
      coverageScales: undefined
    }
    this.coverageRef = undefined;
    this.lengthRef = undefined;
    this.referenceRef = undefined;
  }
  renderAll() {
    // dc.renderAll();
  }
  componentDidMount() {
    const reads = crossfilter(this.props.data)
    const nReads = reads.size();
    /* we need to create dimensions / groups for each of the graphs.
    This only needs to be done once - it automagically updates! */
    const coverageData = reads
      .dimension((d) => d.location)
      .group((d) => Math.ceil(d/100)*100)
      .all();

    /* create the scales */
    const coverageMaxes = getCoverageMaxes(coverageData)
    const coverageSVG = select(this.coverageRef)
    const coverageScales = calcScales(chartGeom, coverageMaxes.x, coverageMaxes.y)

    /* draw */
    drawAxes(coverageSVG, chartGeom, coverageScales)
    drawBarChart(coverageSVG, chartGeom, coverageScales, coverageData)

    this.setState({
      reads,
      nReads,
      coverageData,
      coverageScales
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

      const coverageSVG = select(this.coverageRef)

      /* do scales need updating? */
      const coverageMaxes = getCoverageMaxes(this.state.coverageData)
      if (coverageMaxes.x !== this.state.coverageScales.x.domain()[1] ||
        coverageMaxes.y !== this.state.coverageScales.y.domain()[1]) {
        newState.coverageScales = calcScales(chartGeom, coverageMaxes.x, coverageMaxes.y)
        drawAxes(coverageSVG, chartGeom, newState.coverageScales)
      } else {
        newState.coverageScales = this.state.coverageScales
      }

      /* draw data (it must have updated) */
      drawBarChart(coverageSVG, chartGeom, newState.coverageScales, this.state.coverageData)
      this.setState(newState)
      console.timeEnd("CDU")
    }
  }

  render() {
    return (
      <div {...outerStyles}>
        <div {...flexRowContainer}>
          <div {...panelTitle}>
            {`${this.props.info}.
            Data version ${this.props.version}.
            Total reads: ${this.state.nReads}.`}
          </div>
          <button {...resetStyle} onClick={() => {console.log("reset filters")}}>
            reset filters
          </button>
        </div>
        <div {...flexRowContainer}>
          <div {...panelElement}>
            <div {...chartTitle}>{"coverage"}</div>
            <svg ref={(r) => {this.coverageRef = r}} height={chartGeom.height} width={chartGeom.width}/>
          </div>
          <div {...panelElement}>
            <div {...chartTitle}>{"length"}</div>
            <div ref={(r) => {this.lengthRef = r}}/>
          </div>
          <div {...panelElement}>
            <div {...chartTitle}>{"reference"}</div>
            <div ref={(r) => {this.referenceRef = r}}/>
          </div>
        </div>
      </div>
    )

  }
}

export default Panel;

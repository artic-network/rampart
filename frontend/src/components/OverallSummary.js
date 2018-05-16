import React from 'react';
import { css } from 'glamor';
import { select } from "d3-selection";
import {flexRowContainer, outerStyles, panelTitle, chartTitle} from "./Panel";
import {calcScales, drawAxes, drawScatter} from "../utils/constructChart";

const panelElement = css({
  width: '25%',
  margin: 'auto'
})

const chartGeom = {
  width: 375,
  height: 250,
  spaceLeft: 40,
  spaceRight: 10,
  spaceBottom: 20,
  spaceTop: 10
};


class OverallSummary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.coverageDOMRef = undefined;
    this.winningReferencesDOMRef = undefined;
    this.readsOverTimeDOMRef = undefined;
    this.nReadsPerChannelDOMRef = undefined;
  }
  componentDidMount() {
    /* create the scales */
    /* reads over time */
    const finalPoint = this.props.readsOverTime.slice(-1)[0];
    const timeMax = finalPoint[0] > 60 ? finalPoint[0] : 60;
    const readsMax = finalPoint[1] > 10000 ? finalPoint[1] : 10000;
    const readsOverTimeScales = calcScales(chartGeom, timeMax, readsMax);


    /* draw reads over time */
    const readsOverTimeSVG = select(this.readsOverTimeDOMRef);
    drawAxes(readsOverTimeSVG, chartGeom, readsOverTimeScales)
    drawScatter(readsOverTimeSVG, chartGeom, readsOverTimeScales, this.props.readsOverTime)

    this.setState({
      readsOverTimeScales,
    })
  }

  componentDidUpdate(prevProps) {
    if (prevProps.version !== this.props.version) {
      console.log("CDU overall")
      // console.time("CDU for channel ", this.state.channelNumber)
      const readsOverTimeSVG = select(this.readsOverTimeDOMRef);
      const newState = {};
      /* do scales need updating? */
      const finalPoint = this.props.readsOverTime.slice(-1)[0];
      const timeMax = finalPoint[0] > 60 ? finalPoint[0] : 60;
      const readsMax = finalPoint[1] > 10000 ? finalPoint[1] : 10000;
      if (timeMax !== this.state.readsOverTimeScales.x.domain()[1] ||
        readsMax !== this.state.readsOverTimeScales.y.domain()[1]) {
        newState.readsOverTimeScales = calcScales(chartGeom, timeMax, readsMax);
        drawAxes(readsOverTimeSVG, chartGeom, newState.readsOverTimeScales)
      } else {
        newState.readsOverTimeScales = this.state.readsOverTimeScales;
      }
      /* draw data (it must have updated) */
      drawScatter(readsOverTimeSVG, chartGeom, newState.readsOverTimeScales, this.props.readsOverTime)
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
            {`Overall Summary.
            Total reads: ${this.props.nTotalReads}.
            Time elapsed: ${this.props.readsOverTime.slice(-1)[0][0]}s.
            `}
          </div>
        </div>
        <div {...flexRowContainer}>
          <div {...panelElement}>
            <div {...chartTitle}>{"coverage"}</div>
            <svg ref={(r) => {this.coverageDOMRef = r}} height={chartGeom.height} width={chartGeom.width}/>
          </div>
          <div {...panelElement}>
            <div {...chartTitle}>{"Winning References"}</div>
            <svg ref={(r) => {this.winningReferencesDOMRef = r}} height={chartGeom.height} width={chartGeom.width}/>
          </div>
          <div {...panelElement}>
            <div {...chartTitle}>{"Reads over time"}</div>
            <svg ref={(r) => {this.readsOverTimeDOMRef = r}} height={chartGeom.height} width={chartGeom.width}/>
          </div>
          <div {...panelElement}>
            <div {...chartTitle}>{"Number of reads per channel"}</div>
            <svg ref={(r) => {this.nReadsPerChannelDOMRef = r}} height={chartGeom.height} width={chartGeom.width}/>
          </div>
        </div>
      </div>
    )
  }
}

export default OverallSummary;

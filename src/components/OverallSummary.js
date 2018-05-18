import React from 'react';
import { css } from 'glamor';
import { select } from "d3-selection";
import { rgb } from "d3-color";
import { interpolateHcl } from "d3-interpolate";
import { scaleLinear } from "d3-scale";
import {calcScales, drawAxes, drawScatter, drawVerticalBarChart} from "../utils/constructChart";
import {drawCoverage} from "../utils/coverage";

const channelColours = ["#462EB9", "#3E58CF", "#4580CA", "#549DB2", "#69B091", "#83BA70", "#A2BE57", "#C1BA47", "#D9AD3D", "#E69136", "#E4632E", "#DC2F24"];

const panelContainer = css({
  width: 'calc(100% - 30px)',
  height: "300px",
  minHeight: "300px", // TODO
  boxShadow: '0px 2px rgba(0, 0, 0, 0.14) inset',
  margin: "10px 10px 10px 10px"
})

export const panelTitle = css({
  "fontWeight": "bold",
  "fontSize": "1.3em"
})

const flexRow = css({
  display: "flex",
  'flexDirection': 'row',
  justifyContent: 'space-between',
  height: "calc(100% - 25px)"
})

const chartContainer = css({
  width: '25%',
  margin: 'auto',
  height: "100%"
})

export const chartTitle = css({
  textAlign: "center",
  "fontWeight": "bold",
  "fontSize": "1em"
})


/* given the DOM dimensions of the chart container, calculate the chart geometry (used by the SVG & D3) */
const calcChartGeom = (DOMRect) => ({
  width: DOMRect.width,
  height: DOMRect.height - 20, // title line
  spaceLeft: 40,
  spaceRight: 10,
  spaceBottom: 20,
  spaceTop: 10
});


const getMaxsOfReadsOverTime = (readsOverTime) => {
  const finalPoint = readsOverTime.slice(-1)[0];
  const timeMax = finalPoint[0] > 60 ? finalPoint[0] : 60;
  const readsMax = finalPoint[1] > 10000 ? finalPoint[1] : 10000;
  return [timeMax, readsMax]
}
const processReadsPerChannel = (readsPerChannel) => {
  const xy = readsPerChannel.map((cf, idx) => [idx+1, cf.size()]);
  return {
    xy,
    maxX: readsPerChannel.length,
    maxY: xy.reduce((max, cv) => cv[1] > max ? cv[1] : max, 0)
  }
}
const haveMaxesChanged = (scales, newMaxX, newMaxY) => {
  return newMaxX !== scales.x.domain()[1] || newMaxY !== scales.y.domain()[1];
}

const drawRefHeatMap = (svg, chartGeom, scales, cfData, colourScale) => {
  /* step1 : flatten cfData */
  /* data point structure for d3: [channel # (1-based),  ref idx (1-based), ref match % (over [0, 100])] */
  const data = cfData.reduce((acc, laneData, laneIdx) => {
    const totalReadsInLane = laneData.reduce((acc, cv) => acc + cv.value, 0);
    const points = laneData.map((cellData, refIdx) => [laneIdx+1, refIdx+1, cellData.value / totalReadsInLane * 100]);
    return acc.concat(points)
  }, []);

  svg.selectAll(".heat").remove();
  const cellSize = 20;
  svg.selectAll(".heat")
    .data(data)
    .enter().append("rect")
    .attr("class", "heat")
    .attr('width', cellSize)
    .attr('height', cellSize)
    .attr("x", d => scales.x(d[0]-1))
    .attr("y", d => scales.y(d[1]))
    .attr("fill", d => colourScale(d[2]));
}

const getCoverageMaxes = (coveragePerChannel) => {
  /* do this in app and only check the "new" data to change things... */
  const maxX = coveragePerChannel.reduce((acc, channelData) => {
    return channelData.slice(-1)[0].key;
  }, 0)
  const maxY = coveragePerChannel.reduce((outerAcc, channelData) => {
    const channelMax = channelData.reduce((innerAcc, point) => {
      return point.value > innerAcc ? point.value : innerAcc;
    }, 0);
    return channelMax > outerAcc ? channelMax : outerAcc;
  }, 0)
  return [maxX, maxY];
}

class OverallSummary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {chartGeom: {}};
    this.coverageDOMRef = undefined;
    this.winningReferencesDOMRef = undefined;
    this.readsOverTimeDOMRef = undefined;
    this.readsPerChannelDOMRef = undefined;
  }
  componentDidMount() {
    console.log("CDU", this.panelDOMRef.getBoundingClientRect())
    const chartGeom = calcChartGeom(this.panelDOMRef.getBoundingClientRect());
    const newState = {
      readsOverTimeSVG: select(this.readsOverTimeDOMRef),
      readsPerChannelSVG: select(this.readsPerChannelDOMRef),
      winningReferencesSVG: select(this.winningReferencesDOMRef),
      coverageSVG: select(this.coverageDOMRef),
      chartGeom
    }


    /* create the scales */
    /* reads over time */
    newState.readsOverTimeScales = calcScales(chartGeom, ...getMaxsOfReadsOverTime(this.props.readsOverTime));
    /* reads per channel */
    const rpc = processReadsPerChannel(this.props.readsPerChannel);
    newState.readsPerChannelScales = calcScales(chartGeom, rpc.maxX, rpc.maxY);
    /* winning references - a little different, the scales never need updating :) */
    newState.refMatchPerChannelScales = calcScales(
      chartGeom,
      this.props.refMatchPerChannel.length,
      this.props.refMatchPerChannel[0].length
    );
    /* coverage spark lines */
    newState.coveragePerChannelScales = calcScales(chartGeom, ...getCoverageMaxes(this.props.coveragePerChannel));

    /*        D R A W    A X E S    &      D A T A       */
    /* draw reads over time */
    drawAxes(newState.readsOverTimeSVG, chartGeom, newState.readsOverTimeScales)
    drawScatter(newState.readsOverTimeSVG, chartGeom, newState.readsOverTimeScales, this.props.readsOverTime)
    /* draw reads per channel */
    drawAxes(newState.readsPerChannelSVG, chartGeom, newState.readsPerChannelScales)
    drawVerticalBarChart(newState.readsPerChannelSVG, chartGeom, newState.readsPerChannelScales, rpc.xy, channelColours)
    /* draw ref vs lanes heat map */
    drawAxes(newState.winningReferencesSVG, chartGeom, newState.refMatchPerChannelScales)
    // const heatColours = ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"]; // alternatively colorbrewer.YlGnBu[9]
    newState.heatColourScale = scaleLinear()
      .domain([0, 100])
      // .range(heatColours)
      .interpolate(interpolateHcl)
      .range([rgb("#007AFF"), rgb('#FFF500')]);
    drawRefHeatMap(newState.winningReferencesSVG, chartGeom, newState.refMatchPerChannelScales, this.props.refMatchPerChannel, newState.heatColourScale)
    // coverage
    drawAxes(newState.coverageSVG, chartGeom, newState.coveragePerChannelScales)
    drawCoverage(newState.coverageSVG, chartGeom, newState.coveragePerChannelScales, this.props.coveragePerChannel, channelColours)


    this.setState(newState);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.version !== this.props.version) {
      // console.log("CDU overall")
      const newState = {
        readsOverTimeScales: this.state.readsOverTimeScales,
        readsPerChannelScales: this.state.readsPerChannelScales
      };
      // const chartGeom = calcChartGeom(this.panelDOMRef.getBoundingClientRect());

      /* CALCULATE MAXES & UPDATE SCALES IF NECESSARY */
      const timeMaxReadsMax = getMaxsOfReadsOverTime(this.props.readsOverTime);
      if (haveMaxesChanged(this.state.readsOverTimeScales, ...timeMaxReadsMax)) {
        newState.readsOverTimeScales = calcScales(this.state.chartGeom, ...timeMaxReadsMax);
        drawAxes(this.state.readsOverTimeSVG, this.state.chartGeom, newState.readsOverTimeScales)
      }
      const rpc = processReadsPerChannel(this.props.readsPerChannel);
      if (haveMaxesChanged(this.state.readsPerChannelScales, rpc.maxX, rpc.maxY)) {
        newState.readsPerChannelScales = calcScales(this.state.chartGeom, rpc.maxX, rpc.maxY);
        drawAxes(this.state.readsPerChannelSVG, this.state.chartGeom, newState.readsPerChannelScales)
      }
      /* NOTE the heat map scales never need updating */
      const coverageMaxes = getCoverageMaxes(this.props.coveragePerChannel);
      if (haveMaxesChanged(this.state.coveragePerChannelScales, ...coverageMaxes)) {
        newState.coveragePerChannelScales = calcScales(this.state.chartGeom, ...coverageMaxes);
        drawAxes(this.state.coverageSVG, this.state.chartGeom, newState.coveragePerChannelScales)
      }


      /* REDRAW EVERYTHING (DATA HAS UPDATED) */
      drawScatter(this.state.readsOverTimeSVG, this.state.chartGeom, newState.readsOverTimeScales, this.props.readsOverTime)
      drawVerticalBarChart(this.state.readsPerChannelSVG, this.state.chartGeom, newState.readsPerChannelScales, rpc.xy, channelColours)
      drawRefHeatMap(this.state.winningReferencesSVG, this.state.chartGeom, this.state.refMatchPerChannelScales, this.props.refMatchPerChannel, this.state.heatColourScale)
      drawCoverage(this.state.coverageSVG, this.state.chartGeom, newState.coveragePerChannelScales, this.props.coveragePerChannel, channelColours)


      this.setState(newState)
    }
  }
  render() {
    // <button {...resetStyle} onClick={() => {console.log("reset filters")}}>
    //   reset filters
    // </button>
    console.log("RENDER", this.state.chartGeom)
    return (
      <div {...panelContainer}>
        <div {...panelTitle}>
          {`Overall Summary.
          Total reads: ${this.props.nTotalReads}.
          Time elapsed: ${this.props.readsOverTime.slice(-1)[0][0]}s.
          `}
        </div>
        <div {...flexRow}>
          <div {...chartContainer} ref={(r) => {this.panelDOMRef = r}}>
            <div {...chartTitle}>{"coverage"}</div>
            <svg
              ref={(r) => {this.coverageDOMRef = r}}
              height={this.state.chartGeom.height || 0}
              width={this.state.chartGeom.width || 0}
            />
          </div>
          <div {...chartContainer}>
            <div {...chartTitle}>{"Winning References"}</div>
            <svg
              ref={(r) => {this.winningReferencesDOMRef = r}}
              height={this.state.chartGeom.height || 0}
              width={this.state.chartGeom.width || 0}
            />
          </div>
          <div {...chartContainer}>
            <div {...chartTitle}>{"Reads over time"}</div>
            <svg
              ref={(r) => {this.readsOverTimeDOMRef = r}}
              height={this.state.chartGeom.height || 0}
              width={this.state.chartGeom.width || 0}
            />
          </div>
          <div {...chartContainer}>
            <div {...chartTitle}>{"Number of reads per channel"}</div>
            <svg
              ref={(r) => {this.readsPerChannelDOMRef = r}}
              height={this.state.chartGeom.height || 0}
              width={this.state.chartGeom.width || 0}
            />
          </div>
        </div>
      </div>
    )
  }
}

export default OverallSummary;

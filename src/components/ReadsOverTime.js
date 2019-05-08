import React from 'react';
import { select, mouse } from "d3-selection";
import { line, curveBasis } from "d3-shape";
import {calcScales, drawAxes, makeTimeFormatter, findLineYposGivenXpos} from "../utils/commonFunctions";
import {foreground} from "../utils/colours";

const timeFormatter = makeTimeFormatter();

/* given the DOM dimensions of the chart container, calculate the chart geometry (used by the SVG & D3) */
const calcChartGeom = (DOMRect) => ({
  width: DOMRect.width,
  height: DOMRect.height - 20, // title line
  spaceLeft: 60,
  spaceRight: 0,
  spaceBottom: 60,
  spaceTop: 10
});

const getMaxsOfReadsOverTime = (readsOverTime) => {
  const finalPoint = readsOverTime.slice(-1)[0];
  const timeMax = (parseInt(finalPoint.time/30, 10) +1) * 30;
  const resolution = finalPoint.mappedCount > 10000 ? 10000 :
    finalPoint.mappedCount > 1000 ? 1000 :
      finalPoint.mappedCount > 100 ? 100 : 10;
  const readsMax = (parseInt(finalPoint.mappedCount/resolution, 10) +1) * resolution;
  return [timeMax, readsMax]
}

const drawLine = (svg, scales, data, infoRef) => {
  const lineGenerator = line()
    .x((d) => scales.x(d.time))
    .y((d) => scales.y(d.mappedCount))
    .curve(curveBasis);

  function handleMouseMove() {
    const [mouseX, mouseY] = mouse(this); // [x, y] x starts from left, y starts from top
    const left  = mouseX > 0.5 * scales.x.range()[1] ? "" : `${mouseX + 16}px`;
    const right = mouseX > 0.5 * scales.x.range()[1] ? `${scales.x.range()[1] - mouseX}px` : "";
    const nReads = parseInt(scales.y.invert(findLineYposGivenXpos(mouseX, path.node()))/10, 10)*10
    select(infoRef)
      .style("left", left)
      .style("right", right)
      .style("top", `${mouseY-35}px`)
      .style("visibility", "visible")
      .html(`
        Time: ${timeFormatter(scales.x.invert(mouseX))}
        <br/>
        n(reads): ${nReads} (interpolated)
      `);
  }
  function handleMouseOut() {
    select(infoRef).style("visibility", "hidden");
  }

  svg.selectAll(".readsLine").remove();
  const path = svg.append("path")
    .attr("class", "readsLine")
    .attr("fill", "none")
    .attr("stroke", foreground)
    .attr("stroke-width", 5)
    .attr('d', () => (lineGenerator(data)))
  
  /* append a div over the entire graph to catch onHover mouse events */
  svg.append("rect")
    .attr("x", `${scales.x.range()[0]}px`)
    .attr("width", `${scales.x.range()[1] - scales.x.range()[0]}px`)
    .attr("y", `${scales.y.range()[1]}px`)
    .attr("height", `${scales.y.range()[0] - scales.y.range()[1]}px`)
    .attr("fill", "rgba(0,0,0,0)")
    .on("mouseout", handleMouseOut)
    .on("mousemove", handleMouseMove);

}

class ReadsOverTime extends React.Component {
  constructor(props) {
    super(props);
    this.state = {chartGeom: {}};
  }
  redraw() {
    const scales = calcScales(this.state.chartGeom, ...getMaxsOfReadsOverTime(this.props.temporalData));
    const xTicks = this.state.chartGeom.width > 500 ? 5 : this.state.chartGeom.width > 300 ? 3 : 2;
    drawAxes(this.state.svg, this.state.chartGeom, scales, {isTime: true, xTicks})
    drawLine(this.state.svg, scales, this.props.temporalData, this.infoRef)
  }
  componentDidMount() {
    const chartGeom = calcChartGeom(this.boundingDOMref.getBoundingClientRect());
    const svg = select(this.DOMref);
    const hoverWidth = parseInt(chartGeom.width * 1/2, 10);
    this.setState({chartGeom, svg, hoverWidth})
  }
  componentDidUpdate() {
    this.redraw();
  }
  render() {
    return (
      <div className={this.props.className} style={{width: this.props.width}} ref={(r) => {this.boundingDOMref = r}}>
        <div className="chartTitle">
          {this.props.title}
        </div>
        <div className="hoverInfo" style={{maxWidth: this.state.hoverWidth}} ref={(r) => {this.infoRef = r}}/>
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

export default ReadsOverTime;

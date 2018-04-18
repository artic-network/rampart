import {colours} from "../styles/colours"
// import { select } from "d3-selection";
import { scaleLinear } from "d3-scale";
import { axisBottom, axisLeft } from "d3-axis";
export const dataFont = "Lato"; // should be centralised

export const calcScales = (chartGeom, maxX, maxY) => {
  return {
    x: scaleLinear()
      .domain([0, maxX])
      .range([chartGeom.spaceLeft, chartGeom.width - chartGeom.spaceRight]),
    y: scaleLinear()
      .domain([0, maxY])
      .range([chartGeom.height - chartGeom.spaceBottom, chartGeom.spaceTop])
  }
}

const removeXAxis = (svg) => {
  svg.selectAll(".x.axis").remove();
};

const removeYAxis = (svg) => {
  svg.selectAll(".y.axis").remove();
};

export const drawAxes = (svg, chartGeom, scales, numTicks = {x: 5, y: 5}) => {
  removeXAxis(svg);
  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0,${chartGeom.height - chartGeom.spaceBottom})`)
    .style("font-family", dataFont)
    .style("font-size", "12px")
    .call(axisBottom(scales.x).ticks(numTicks.x));
  removeYAxis(svg);
  svg.append("g")
    .attr("class", "y axis")
    .attr("transform", `translate(${chartGeom.spaceLeft},0)`)
    .style("font-family", dataFont)
    .style("font-size", "12px")
    .call(axisLeft(scales.y).ticks(numTicks.y));
};

export const drawBarChart = (svg, chartGeom, scales, data) => {
  svg.selectAll(".bar").remove();
  svg.selectAll(".bar")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", d => scales.x(d.key))
    .attr("width", 10)
    .attr("y", d => scales.y(d.value))
    .attr("height", d => chartGeom.height - chartGeom.spaceBottom - scales.y(d.value));
}

//
// export const constructLengthChart = (DOMref, data, rerender) => {
//   const dimension = data.dimension((d) => d.length);
//   return dc.barChart(DOMref)
//     .height(250)
//     .width(DOMref.clientWidth)
//     .transitionDuration(0)
//     .margins({top: 20, right: 20, bottom: 20, left: 20})
//     .dimension(dimension)
//     .group(dimension.group((d) => d))
//     .centerBar(false)
//     .elasticY(true)
//     .gap(0)
//     .colors('steelblue')
//     .x(d3.scale.linear().domain([0, 1000]))
//     .on("filtered", rerender)
//     .xAxis().ticks(10);
// }
//
// export const constructCoverageChart = (DOMref, data, rerender) => {
//   const dimension = data.dimension((d) => d.location);
//   return dc.barChart(DOMref)
//     .height(250)
//     .width(DOMref.clientWidth)
//     .transitionDuration(0)
//     .margins({top: 20, right: 20, bottom: 20, left: 20})
//     .dimension(dimension)
//     .group(dimension.group((d) => d))
//     .centerBar(false)
//     .elasticY(true)
//     .gap(0)
//     .colors('steelblue')
//     .x(d3.scale.linear().domain([0, 10000]))
//     .on("filtered", rerender)
//     .xAxis().ticks(10);
// }
//
// export const constructReferenceChart = (DOMref, data, rerender) => {
//   const dimension = data.dimension((d) => d.reference);
//   return dc.rowChart(DOMref)
//     .height(250)
//     .width(DOMref.clientWidth)
//     .transitionDuration(0)
//     .margins({top: 20, right: 20, bottom: 20, left: 20})
//     .dimension(dimension)
//     .group(dimension.group((d) => d))
//     .ordinalColors(colours.rainbow5)
//     .label((d) => `${d.key}: ${d.value} reads`)
//     .elasticX(true)
//     .on("filtered", rerender)
//     .xAxis().ticks(10);
// }

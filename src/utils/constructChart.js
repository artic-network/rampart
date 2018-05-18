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
    .attr("width", 10) // TODO
    .attr("y", d => scales.y(d.value))
    .attr("height", d => chartGeom.height - chartGeom.spaceBottom - scales.y(d.value));
}

export const drawVerticalBarChart = (svg, chartGeom, scales, data, fills) => {
  svg.selectAll(".bar").remove();
  svg.selectAll(".bar")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", d => scales.x(d[0]))
    .attr("width", 10) // TODO
    .attr("y", d => scales.y(d[1]))
    .attr("fill",(d, i) => fills[i])
    .attr("height", d => chartGeom.height - chartGeom.spaceBottom - scales.y(d[1]));
}

export const drawScatter = (svg, chartGeom, scales, data) => {
  svg.selectAll(".scatterDot").remove();
  svg.selectAll(".scatterDot")
    .data(data)
    .enter().append("circle")
    .attr("class", "scatterDot")
    .attr("r", 10)
    .attr("cx", d => scales.x(d[0]))
    .attr("cy", d => scales.y(d[1]))
    .attr("fill", "pink");
}

export const drawRefChart = (svg, chartGeom, scales, data) => {
  svg.selectAll(".bar").remove();
  svg.selectAll(".bar")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", scales.x(0) + 1)
    .attr("width", d => scales.x(d.value))
    .attr("y", (d, i) => scales.y(i) - 20)
    .attr("height", 20)
    .attr("fill",(d, i) => colours.rainbow5[i]);
  /* labels */
  svg.selectAll(".text").remove();
  svg.selectAll(".text")
    .data(data)
    .enter().append("text")
    .attr("class", "text")
    .attr("x", scales.x(0) + 1)
    .attr("y", (d, i) => scales.y(i) - 2)
    .attr("font-family", "lato")
    .attr("font-size", "20px")
    .attr("fill", "white")
    .text(d => d.key);

}

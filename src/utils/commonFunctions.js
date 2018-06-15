import { scaleLinear, scaleOrdinal } from "d3-scale";
import { axisBottom, axisLeft } from "d3-axis";

const dataFont = "Lato"; // should be centralised

export const haveMaxesChanged = (scales, newMaxX, newMaxY) => {
  return newMaxX !== scales.x.domain()[1] || newMaxY !== scales.y.domain()[1];
}

const removeXAxis = (svg) => {
  svg.selectAll(".x.axis").remove();
};

const removeYAxis = (svg) => {
  svg.selectAll(".y.axis").remove();
};

export const drawXAxis = (svg, chartGeom, scales, numTicks) => {
  removeXAxis(svg);
  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0,${chartGeom.height - chartGeom.spaceBottom})`)
    .style("font-family", dataFont)
    .style("font-size", "12px")
    .call(axisBottom(scales.x).ticks(numTicks.x));
}

export const drawYAxis = (svg, chartGeom, scales, numTicks) => {
  removeYAxis(svg);
  svg.append("g")
    .attr("class", "y axis")
    .attr("transform", `translate(${chartGeom.spaceLeft},0)`)
    .style("font-family", dataFont)
    .style("font-size", "12px")
    .call(axisLeft(scales.y).ticks(numTicks.y));
}

export const drawAxes = (svg, chartGeom, scales, numTicks = {x: 5, y: 5}) => {
  drawXAxis(svg, chartGeom, scales, numTicks.x)
  drawYAxis(svg, chartGeom, scales, numTicks.y)
};

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

export const calcScalesOrdinalX = (chartGeom, nX, maxY) => {
  const xRangePerPoint = (chartGeom.width - chartGeom.spaceRight - chartGeom.spaceLeft) / nX;
  return {
    x: scaleOrdinal()
      .domain([...Array(nX).keys()].map(x => x+1))
      .range([...Array(nX).keys()].map(x => (x+1)*xRangePerPoint + chartGeom.spaceLeft)),
    y: scaleLinear()
      .domain([0, maxY])
      .range([chartGeom.height - chartGeom.spaceBottom, chartGeom.spaceTop])
  }
}

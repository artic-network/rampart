import { line, curveCatmullRom } from "d3-shape";


export const drawCurve = (svg, chartGeom, scales, data, colours) => {
  /* data is array of channelData */
  /* https://stackoverflow.com/questions/8689498/drawing-multiple-lines-in-d3-js */
  const makeLinePath = line()
    .x((d) =>scales.x(d.key))
    .y((d) =>scales.y(d.value))
    .curve(curveCatmullRom.alpha(0.3));

  svg.selectAll(".line").remove();
  try {
    svg.selectAll(".line")
      .data(data)
      .enter().append("path")
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", (d, i) => colours[i])
      .attr('d', makeLinePath);
  } catch (err) {
    console.log("d3 spark lines error", err)
  }
}


export const drawCoverage = (svg, chartGeom, scales, data, colours, annotation) => {
  drawCurve(svg, chartGeom, scales, data, colours)
}

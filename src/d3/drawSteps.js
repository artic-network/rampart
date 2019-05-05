import {color as d3color} from "d3-color";
import { line, curveStep, area } from "d3-shape";
import { getLeftRightTop } from "./genomeAnnotation";
import { mouse } from "d3-selection";

/**
 * @param {obj} args 
 * @param {obj} args.svg d3 selection object
 * @param {obj} args.chartGeom
 * @param {obj} args.scales keys: `x`, `y`. values: d3 scale objects
 * @param {arr of arr} args.coverages list of `[name, coverage]` to draw
 * @param {obj} args.sampleColours name->colour map
 * @param {int} args.genomeResolution
 * @param {bool} args.fillBelowLine
 */
export const drawSteps = ({svg, chartGeom, scales, coverages, sampleColours, genomeResolution, fillBelowLine=false, hoverSelection=false}) => {
    /* https://stackoverflow.com/questions/8689498/drawing-multiple-lines-in-d3-js */
    let pathGenerator;
    if (fillBelowLine) {
        pathGenerator = area()
            .x((d, i) => scales.x(i*genomeResolution))
            .y0((d) => scales.y(d))
            .y1(scales.y.range()[0])
            .curve(curveStep);
    } else {
        pathGenerator = line()
            .x((d, i) => scales.x(i*genomeResolution))
            .y((d) => scales.y(d))
            .curve(curveStep);
    }

    const colours = coverages.map((x) => sampleColours[x[0]]);

    function handleMouseMove(d, i) {
      if (!hoverSelection) return;
      /* i: idx of which coverages array is being displayed (_not_ the idx of the coverage array) */ 
      /* d: array of coverage values */
      const [left, right, top] = getLeftRightTop(this, scales);
      const range = scales.x.range();
      const coverageIdx = Math.floor( (mouse(this)[0]-range[0]) / (range[1]-range[0]) * d.length );
      hoverSelection
        .style("left", left)
        .style("right", right)
        .style("top", top)
        .style("visibility", "visible")
        .html(`Sample: ${coverages[i][0]}<br/>Depth: ${d[coverageIdx]}x`);
      }
    function handleMouseOut() {
      if (!hoverSelection) return;
      hoverSelection.style("visibility", "hidden");
    }

    svg.selectAll(".coverageLine").remove();
    svg.selectAll(".coverageLine")
        .data(coverages.map((a) => a[1])) // d3 wants list of coverage arrays
        .enter().append("path")
        .attr("class", "coverageLine")
        .attr("fill", (d, i) => fillBelowLine ? colours[i] : "none")
        .attr("stroke", (d, i) => fillBelowLine ? d3color(colours[i]).darker(2) : colours[i])
        .attr('d', pathGenerator)
        .on("mouseout", handleMouseOut)
        .on("mousemove", handleMouseMove);
}

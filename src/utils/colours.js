import { interpolateYlGnBu, interpolateRdPu, interpolateYlOrBr } from "d3-scale-chromatic";
import { range } from "d3-array";
import { rgb } from "d3-color"; // eslint-disable-line
import { interpolateHcl } from "d3-interpolate"; // eslint-disable-line
import { scaleLinear, scaleSequential } from "d3-scale"; // eslint-disable-line

/* https://github.com/d3/d3-scale-chromatic */

export const createSampleColours = (n) => {
  const linSpace = range(n).map((d) => d/n+1/n);
  return linSpace.map((x) => interpolateYlGnBu(x));
}

export const createReferenceColours = (n) => {
  const linSpace = range(n).map((d) => d/n+1/n); /* don't include 0 or 1 */
  return linSpace.map((x) => interpolateRdPu(x));
}

export const heatColourScale = scaleSequential(interpolateYlOrBr)
  .domain([0, 100])

/* OLD HEATMAP SCALE FN */
// export const heatColourScale = scaleLinear()
//   .domain([0, 100])
//   .interpolate(interpolateHcl)
//     .range([rgb('#F6EECA'), rgb('#005C68')]
//   );

export const foreground = "#235a64";

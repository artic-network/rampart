import { interpolateYlOrRd, interpolateSpectral } from "d3-scale-chromatic";
import { range } from "d3-array";
import { rgb } from "d3-color"; // eslint-disable-line
import { interpolateHcl } from "d3-interpolate"; // eslint-disable-line
import { scaleLinear, scaleSequential } from "d3-scale"; // eslint-disable-line

/* https://github.com/d3/d3-scale-chromatic */

export const createSampleColours = (n) => {
  const linSpace = range(n).map((d) => d/n+1/n);
  return linSpace.map((x) => interpolateSpectral(1-x));
}

export const createReferenceColours = (n) => {
    return referenceDiscreteColours;
  // const linSpace = range(n).map((d) => d/n+1/n); /* don't include 0 or 1 */
  // return linSpace.map((x) => interpolateRdPu(x));
}

export const heatColourScale = scaleSequential(interpolateYlOrRd)
  .domain([0, 100])

/* OLD HEATMAP SCALE FN */
// export const heatColourScale = scaleLinear()
//   .domain([0, 100])
//   .interpolate(interpolateHcl)
//     .range([rgb('#F6EECA'), rgb('#005C68')]
//   );

export const foreground = "#235a64";

export const referenceDiscreteColours = [
    "#086375",
    "#DB504A",
    "#E3B505",
    "#06D6A0",
    "#118AB2",
    "#AAAAAA",
    "#A23B72",
    "#F18F01",
    "#C73E1D",
    "#3B1F2B",
    "#70C1B3",
    "#FFE066",
    "#247BA0"
]


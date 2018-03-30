import dc from "dc"
import d3 from "d3"
import {colours} from "../styles/colours"

export const constructLengthChart = (DOMref, data, rerender) => {
  const dimension = data.dimension((d) => d.length);
  return dc.barChart(DOMref)
    .height(250)
    .width(DOMref.clientWidth)
    .transitionDuration(0)
    .margins({top: 20, right: 20, bottom: 20, left: 20})
    .dimension(dimension)
    .group(dimension.group((d) => d))
    .centerBar(false)
    .elasticY(true)
    .gap(0)
    .colors('steelblue')
    .x(d3.scale.linear().domain([0, 1000]))
    .on("filtered", rerender)
    .xAxis().ticks(10);
}

export const constructCoverageChart = (DOMref, data, rerender) => {
  const dimension = data.dimension((d) => d.location);
  return dc.barChart(DOMref)
    .height(250)
    .width(DOMref.clientWidth)
    .transitionDuration(0)
    .margins({top: 20, right: 20, bottom: 20, left: 20})
    .dimension(dimension)
    .group(dimension.group((d) => d))
    .centerBar(false)
    .elasticY(true)
    .gap(0)
    .colors('steelblue')
    .x(d3.scale.linear().domain([0, 10000]))
    .on("filtered", rerender)
    .xAxis().ticks(10);
}

export const constructReferenceChart = (DOMref, data, rerender) => {
  const dimension = data.dimension((d) => d.reference);
  return dc.rowChart(DOMref)
    .height(250)
    .width(DOMref.clientWidth)
    .transitionDuration(0)
    .margins({top: 20, right: 20, bottom: 20, left: 20})
    .dimension(dimension)
    .group(dimension.group((d) => d))
    .ordinalColors(colours.rainbow5)
    .label((d) => `${d.key}: ${d.value} reads`)
    .elasticX(true)
    .on("filtered", rerender)
    .xAxis().ticks(10);
}

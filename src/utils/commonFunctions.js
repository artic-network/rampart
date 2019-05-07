import { scaleLinear, scaleLog } from "d3-scale";
import { axisBottom, axisLeft } from "d3-axis";
import { timeFormat } from "d3-time-format";

export const makeTimeFormatter = () => {
  /* https://stackoverflow.com/questions/39577795/d3-format-an-integer-as-time-on-24-hour-clock */
  /* https://github.com/d3/d3-time-format */
  /* must be a factory, else really weird bugs ensue */
  const [formatSeconds, formatMinutes, formatHours] = [timeFormat("%Ss"), timeFormat("%Mm%Ss"), timeFormat("%Hh%Mm%Ss")];

  return (nSeconds) => {
    const timeObj = new Date();
    timeObj.setHours(0, 0, 0, 0);
    if (nSeconds === 0) return "0s";
    timeObj.setSeconds(nSeconds);
    if (nSeconds < 60) {
      return formatSeconds(timeObj);
    } else if (nSeconds <= 3600) {
      return formatMinutes(timeObj);
    }
    return formatHours(timeObj);
  };
}


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

export const drawXAxis = (svg, chartGeom, scales, numTicks, isTime, suffix) => {
  removeXAxis(svg);
  let tickFormatter = null;
  if (isTime) {
    tickFormatter = makeTimeFormatter();
  }
  if (suffix && !isTime) {
    tickFormatter = (val) => `${val}${suffix}`;
  }

  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0,${chartGeom.height - chartGeom.spaceBottom})`)
    .style("font-family", dataFont)
    .style("font-size", "12px")
    .call(
      axisBottom(scales.x)
        .ticks(numTicks)
        .tickFormat(tickFormatter)
    );
}

export const drawYAxis = (svg, chartGeom, scales, numTicks, suffix) => {
  removeYAxis(svg);
  let tickFormatter = null;
  if (suffix) {
    tickFormatter = (val) => `${val}${suffix}`;
  }

  svg.append("g")
    .attr("class", "y axis")
    .attr("transform", `translate(${chartGeom.spaceLeft},0)`)
    .style("font-family", dataFont)
    .style("font-size", "12px")
    .call(
      axisLeft(scales.y)
        .ticks(numTicks)
        .tickFormat(tickFormatter)
    );
}

export const drawAxes = (svg, chartGeom, scales, {xTicks=5, yTicks=5, isTime=false, xSuffix=false, ySuffix=false}={}) => {
  drawXAxis(svg, chartGeom, scales, xTicks, isTime, xSuffix)
  drawYAxis(svg, chartGeom, scales, yTicks, ySuffix)
};

export const calcXScale = (chartGeom, maxX) => {
  return scaleLinear()
    .domain([0, maxX])
    .range([chartGeom.spaceLeft, chartGeom.width - chartGeom.spaceRight]);
}

export const calcYScale = (chartGeom, maxY, {log=false}={}) => {
  const range = [chartGeom.height - chartGeom.spaceBottom, chartGeom.spaceTop];
  if (log) {
    return scaleLog().base(10)
    .domain([1, maxY]).range(range)
    .clamp(true);
  }
  return scaleLinear()
    .domain([0, maxY]).range(range);
}

export const calcScales = (chartGeom, maxX, maxY) => {
  return {x: calcXScale(chartGeom, maxX), y: calcYScale(chartGeom, maxY)};
}


/* https://stackoverflow.com/questions/11503151/in-d3-how-to-get-the-interpolated-line-data-from-a-svg-line/39442651#39442651 */
export const findLineYposGivenXpos = function(x, path, error) {
  var length_end = path.getTotalLength()
    , length_start = 0
    , point = path.getPointAtLength((length_end + length_start) / 2) // get the middle point
    , bisection_iterations_max = 50
    , bisection_iterations = 0

  error = error || 0.01

  while (x < point.x - error || x > point.x + error) {
    // get the middle point
    point = path.getPointAtLength((length_end + length_start) / 2)

    if (x < point.x) {
      length_end = (length_start + length_end)/2
    } else {
      length_start = (length_start + length_end)/2
    }

    // Increase iteration
    if(bisection_iterations_max < ++ bisection_iterations)
      break;
  }
  return point.y
}
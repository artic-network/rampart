/*
 * Copyright (c) 2019 ARTIC Network http://artic.network
 * https://github.com/artic-network/rampart
 *                            
 * This file is part of RAMPART. RAMPART is free software: you can redistribute it and/or modify it under the terms of the 
 * GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your 
 * option) any later version. RAMPART is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  
 *
 * See the GNU General Public License for more details. You should have received a copy of the GNU General Public License 
 * along with RAMPART. If not, see <http://www.gnu.org/licenses/>.
 *
 */

import {color as d3color} from "d3-color";
import { line, curveStep, area } from "d3-shape";
import { getLeftRightTop } from "./genomeAnnotation";
import { mouse } from "d3-selection";

/**
 * @param {obj} args 
 * @param {d3Selection} args.svg d3 selection object
 * @param {obj} args.chartGeom
 * @param {obj} args.scales keys: `x`, `y`. values: d3 scale objects
 * @param {arr of arr} args.coverages list of `[name, coverage]` to draw
 * @param {array of obj} args.data array of lines to display. 
 *                       `args.data[i].name` {string}
 *                       `args.data[i].colour` {string}
 *                       `args.data[i].xyValues` {array of [numeric, numeric]} the x & y points to draw
 * @param {bool} args.fillBelowLine OPTIONAL
 * @param {false || d3Selection} args.hoverSelection OPTIONAL
 * @param {false || function} args.hoverDisplayFunc OPTIONAL. Function to displayHTML.
 *    Function args: 1 object with props `name` (from `data` array above), `xValue`, `yValue`
 */
export const drawSteps = ({svg, chartGeom, scales, data, fillBelowLine=false, hoverSelection=false, hoverDisplayFunc=false}) => {
    /* https://stackoverflow.com/questions/8689498/drawing-multiple-lines-in-d3-js */
    let pathGenerator;
    if (fillBelowLine) {
        pathGenerator = area()
            .x((d) => scales.x(d[0]))//scales.x(i*genomeResolution))
            .y0((d) => scales.y(d[1]))
            .y1(scales.y.range()[0])
            .curve(curveStep);
    } else {
        pathGenerator = line()
            .x((d, i) => scales.x(d[0]))
            .y((d) => scales.y(d[1]))
            .curve(curveStep);
    }

    const colours = data.map((d) => d.colour);

    function handleMouseMove(d, i) {
        if (!hoverSelection) return;
        /* i: idx of which coverages array is being displayed (_not_ the idx of the coverage array) */ 
        /* d: array of xyValues values */
        const [left, right, top] = getLeftRightTop(this, scales);

        const xValueApprox = scales.x.invert(mouse(this)[0]);
        /* find the xyValue closest to this -- they are in order so it's not too hard */
        /* bisect algorithm would be faster */
        let xyValuesIdx = 0;
        for (xyValuesIdx=0; xyValuesIdx<d.length; xyValuesIdx++) {
          if (d[xyValuesIdx][0]>xValueApprox) break;
        }
        const html = hoverDisplayFunc({name: data[i].name, xValue: d[xyValuesIdx][0], yValue: d[xyValuesIdx][1]})

        hoverSelection
          .style("left", left)
          .style("right", right)
          .style("top", top)
          .style("visibility", "visible")
          .html(html);
    }
    function handleMouseOut() {
        if (!hoverSelection) return;
        hoverSelection.style("visibility", "hidden");
    }

    svg.selectAll(".coverageLine").remove();
    svg.selectAll(".coverageLine")
        .data(data.map((dataObj) => dataObj.xyValues)) // d3 wants list of coverage arrays
        .enter().append("path")
        .attr("class", "coverageLine")
        .attr("fill", (d, i) => fillBelowLine ? colours[i] : "none")
        .attr("stroke", (d, i) => fillBelowLine ? d3color(colours[i]).darker(2) : colours[i])
        .attr('d', pathGenerator)
        .on("mouseout", handleMouseOut)
        .on("mousemove", handleMouseMove);
}

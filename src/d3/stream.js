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

import { mouse } from "d3-selection";
import { area } from "d3-shape";

export const drawStream = ({svg, scales, stream, referencePanel, hoverSelection, basesPerBin}) => {
    console.log("drawStream", {svg, scales, stream, referencePanel, hoverSelection})
    function handleMouseMove(d, i) {
        const [mouseX, mouseY] = mouse(this); // [x, y] x starts from left, y starts from top
        const left  = mouseX > 0.5 * scales.x.range()[1] ? "" : `${mouseX + 16}px`;
        const right = mouseX > 0.5 * scales.x.range()[1] ? `${scales.x.range()[1] - mouseX}px` : "";

        /* find index of `d` which mouse is currently over */
        const idx = Math.floor(((mouseX - scales.x.range()[0]) / (scales.x.range()[1] - scales.x.range()[0]))*d.length)

        let html = `<p>@ ${idx*basesPerBin}bp:</p>`;
        stream.forEach((dd, ii) => {
          const percMatch = parseInt((dd[idx][1] - dd[idx][0]) * 100, 10);
          if (percMatch > 5) {
            html += `
              <span class="hoverColourSquare" style="background-color: ${referencePanel[ii].colour}"></span>
              <span>${referencePanel[ii].name}: ${percMatch}%</span>
              </br>
            `;
          }
        });
        hoverSelection
            .style("left", left)
            .style("right", right)
            .style("top", `${mouseY}px`)
            .style("visibility", "visible")
            .html(html);
    }
    function handleMouseOut() {
      hoverSelection.style("visibility", "hidden");
    }

    const areaObj = area()
        .x((d, i) => scales.x(i*basesPerBin))
        .y0((d) => scales.y(d[0]*100))
        .y1((d) => scales.y(d[1]*100));

    svg.append("g").selectAll(".stream")
        .data(stream)
        .enter()
        .append("path")
        .attr("d", areaObj)
        .attr("fill", (d, i) => referencePanel[i].colour)
        .attr("opacity", 1)
        .on("mouseout", handleMouseOut)
        .on("mousemove", handleMouseMove);
}

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

export const getLeftRightTop = (that, scales) => {
  const [mouseX, mouseY] = mouse(that); // [x, y] x starts from left, y starts from top
  const left  = mouseX > 0.5 * scales.x.range()[1] ? "" : `${mouseX + 16}px`;
  const right = mouseX > 0.5 * scales.x.range()[1] ? `${scales.x.range()[1] - mouseX}px` : "";
  const top = mouseY+"px";
  return [left, right, top];
}

/* draw the genes (annotations) */
export const drawGenomeAnnotation = (svg, chartGeom, scales, genes, amplicons, hoverSelection) => {
  // svg.selectAll(".gene").remove(); /* only added once, don't need to remove what's not there */

  function handleAmpliconMove(d, i) {
    const [left, right, top] = getLeftRightTop(this, scales);
    hoverSelection
      .style("left", left)
      .style("right", right)
      .style("top", top)
      .style("visibility", "visible")
      .html(`Amplicon ${i + 1} – ${d[0]}-${d[1]}bp`);
    }
  function handleGeneMove(d, i) {
    const [left, right, top] = getLeftRightTop(this, scales);
    hoverSelection
      .style("left", left)
      .style("right", right)
      .style("top", top)
      .style("visibility", "visible")
      .html(`Gene ${d}<br/> ${genes[d].start} - ${genes[d].end}`);
    }
  function handleMouseOut() {
    hoverSelection.style("visibility", "hidden");
  }

  const ampliconRoof = chartGeom.height - chartGeom.spaceBottom + 24; /* all primers & genes below this */
  const ampliconHeight = 8;
  if (amplicons) {
    svg.append("g")
      .attr("id", "amplicons")
      .selectAll(".amplicon")
      .data(amplicons)
      .enter()
      .append("rect")
      .attr("class", "amplicon")
      .attr("x", (d) => scales.x(d[0]))
      .attr("y", (d, i) => i%2 ? ampliconRoof : ampliconRoof+ampliconHeight)
      .attr("width", (d) => scales.x(d[1])-scales.x(d[0]))
      .attr("height", ampliconHeight)
      .on("mouseout", handleMouseOut)
      .on("mousemove", handleAmpliconMove);
  }

  const geneHeight = 15;
  const geneRoof = ampliconRoof + 2*ampliconHeight + 5;
  const calcYOfGene = (name) => genes[name].strand === 1 ? geneRoof : geneRoof+geneHeight;

  const geneNames = Object.keys(genes);

  const genesSel = svg.selectAll(".gene")
    .data(geneNames)
    .enter()
    .append("g");

  genesSel.append("rect")
    .attr("class", "gene")
    .attr("x", (name) => scales.x(genes[name].start))
    .attr("y", calcYOfGene)
    .attr("width", (name) => scales.x(genes[name].end) - scales.x(genes[name].start))
    .attr("height", geneHeight)
    .on("mouseout", handleMouseOut)
    .on("mousemove", handleGeneMove);

  genesSel.append("text")
      .attr("class", "gene-text")
      .attr("x", (name) => scales.x(genes[name].start) + (scales.x(genes[name].end) - scales.x(genes[name].start))/2)
    .attr("y", calcYOfGene)
    .attr("dy", "12px") /* positive values bump down text */
    .attr("text-anchor", "middle") /* centered horizontally */
    .attr("font-size", "12px")
    .attr("font-weight", "600")
    .attr("alignment-baseline", "bottom") /* i.e. y value specifies top of text */
    .attr("pointer-events", "none") /* don't capture mouse over */
    .text((name) => name.length > 10 ? "" : name);
};
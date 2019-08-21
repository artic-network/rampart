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
      .html(`Amplicon ${d[0]}-${d[1]}bp`);
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

  const ampliconRoof = chartGeom.height - chartGeom.spaceBottom + 20; /* all primers & genes below this */
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

  /* https://bl.ocks.org/emmasaunders/0016ee0a2cab25a643ee9bd4855d3464 for text attr values */
  genesSel.append("text")
    .attr("x", (name) => scales.x(genes[name].start) + (scales.x(genes[name].end) - scales.x(genes[name].start))/2)
    .attr("y", calcYOfGene)
    .attr("dy", "12px") /* positive values bump down text */
    .attr("text-anchor", "middle") /* centered horizontally */
    .attr("font-size", "12px")
    .attr("font-weight", "600")
    .attr("alignment-baseline", "hanging") /* i.e. y value specifies top of text */
    .attr("pointer-events", "none") /* don't capture mouse over */
    .text((name) => name.length > 10 ? "" : name);
};
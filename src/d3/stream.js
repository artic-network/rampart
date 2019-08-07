import { mouse } from "d3-selection";
import { area } from "d3-shape";

export const drawStream = ({svg, scales, stream, referencePanel, hoverSelection, genomeResolution}) => {
    console.log("drawStream", {svg, scales, stream, referencePanel, hoverSelection})
    function handleMouseMove(d, i) {
        const [mouseX, mouseY] = mouse(this); // [x, y] x starts from left, y starts from top
        const left  = mouseX > 0.5 * scales.x.range()[1] ? "" : `${mouseX + 16}px`;
        const right = mouseX > 0.5 * scales.x.range()[1] ? `${scales.x.range()[1] - mouseX}px` : "";

        /* find index of `d` which mouse is currently over */
        const idx = Math.floor(((mouseX - scales.x.range()[0]) / (scales.x.range()[1] - scales.x.range()[0]))*d.length)

        let html = `<p>@ ${idx*genomeResolution}bp:</p>`;
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
        .x((d, i) => scales.x(i*genomeResolution))
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

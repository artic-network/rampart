import { select, mouse } from "d3-selection";
import { area } from "d3-shape";
import { genomeResolution } from "../magics";

export const calculateSeries = (referenceMatchAcrossGenome, references) => {
    /* WHAT IS A SERIES?
    this is the data structure demanded by d3 for a stream graph.
    it is often produced by the d3.stack function - see https://github.com/d3/d3-shape/blob/master/README.md#_stack
    but it's faster to create this ourselves.

    THIS IS THE STRUCTURE:
      [x1, x2, ... xn] where n is the number of categorie (e.g. references)
        xi = [y1, y2, ..., ym] where m is the number of pivots (i.e. x points)
          yi = [z1, z2]: the (y0, y1) values of the category at that pivot point.

    /* Data -- referenceMatchAcrossGenome -- is [a][b] where
    a is array of reference panel genomes with counts of hits
    b is the genome regions (times by genomeResolution to get base pair) */
    const numXPoints = referenceMatchAcrossGenome[0].length;
    const series = references.map(() => Array.from(new Array(numXPoints), () => [0, 0]));
    // series = 11 x ~2000 x 2.     3-d array

    for (let xIdx=0; xIdx<numXPoints; xIdx++) {
        let yPosition = 0;
        let totalReadsHere = 0;
        for (let refIdx=0; refIdx<references.length; refIdx++) {
            totalReadsHere += referenceMatchAcrossGenome[refIdx][xIdx];
        }
        if (totalReadsHere > 10) { /* require >10 reads to calc stream */
            for (let refIdx=0; refIdx<references.length; refIdx++) {
                series[refIdx][xIdx][0] = yPosition;
                yPosition += referenceMatchAcrossGenome[refIdx][xIdx] / totalReadsHere;
                series[refIdx][xIdx][1] = yPosition;
            }
        }
    }
    return series;
}

export const drawStream = (svg, scales, series, referenceLabels, referenceColours, infoRef) => {

    function handleMouseMove(d, i) {
        const [mouseX, mouseY] = mouse(this); // [x, y] x starts from left, y starts from top
        const left  = mouseX > 0.5 * scales.x.range()[1] ? "" : `${mouseX + 16}px`;
        const right = mouseX > 0.5 * scales.x.range()[1] ? `${scales.x.range()[1] - mouseX}px` : "";
        select(infoRef)
            .style("left", left)
            .style("right", right)
            .style("top", `${mouseY}px`)
            .style("visibility", "visible")
            .html(`${referenceLabels[i].name}`);
//    .html(`${referenceLabels[i].name}<br />${referenceLabels[i].description}`);
    }
    function handleMouseOut() {
        select(infoRef).style("visibility", "hidden");
    }

    const areaObj = area()
        .x((d, i) => scales.x(i*genomeResolution))
        .y0((d) => scales.y(d[0]*100))
        .y1((d) => scales.y(d[1]*100));

    svg.append("g").selectAll(".stream")
        .data(series)
        .enter()
        .append("path")
        .attr("d", areaObj)
        .attr("fill", (d, i) => referenceColours[i])
        .attr("opacity", 1)
        .on("mouseout", handleMouseOut)
        .on("mousemove", handleMouseMove);
}

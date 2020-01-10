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
import React, {useRef, useState, useEffect} from 'react';

import {drawAxes} from "../../utils/commonFunctions";
import { select } from "d3-selection";
import {scaleLinear, scaleBand} from "d3-scale";
import { histogram } from "d3-array";
import { curveCatmullRom, area } from "d3-shape";

const calcChartGeometry = (ref) => {
    if (!ref.current) return null;
    const {width, height} = ref.current.getBoundingClientRect();
    return {
        width,
        height: height-30,
        spaceLeft: 40,
        spaceRight: 0,
        spaceBottom: 70,
        spaceTop: 20
    }
};


/**
 * Show reference similarity matches for a sample.
 * This is the first chart in RAMPART to use Hooks, and I plan to abstract them out
 * into either (a) a custom Hook or (b) a wrapper.
 * https://www.d3-graph-gallery.com/graph/violin_basicHist.html helped with violin plot
 */
const RefSimilarity = ({width, title, className, colour, data, renderProp}) => {
    const [containerRef, svgRef] = [useRef(null), useRef(null)];
    const [chartGeom, setChartGeom] = useState(null);

    /* magic parameters: */
    const maxViolins = 5;
    const minReadsPerViolin = 50;
    const violinResolution = 50; // how many bins (vertical components of each violin)

    /* When the width has changed we should recompute the bounding box */
    useEffect(() => {
        if (!containerRef.current) return;
        setChartGeom(calcChartGeometry(containerRef));
    }, [width, containerRef]);

    /* When chartGeom changes then we draw everything. Plenty of optimisations here */
    useEffect(() => {
        if (!chartGeom) return;
        const svg = select(svgRef.current);

        const slicedData = data
            .sort((a, b) => a.similarities.length > b.similarities.length ? -1 : 1)
            .slice(0, maxViolins)
            .filter((d) => d.similarities.length >= minReadsPerViolin);

        /* draw axes */
        const scales = {
            x: scaleBand()
                .domain(slicedData.map((d) => d.refName))
                .range([chartGeom.spaceLeft, chartGeom.width - chartGeom.spaceRight - chartGeom.spaceLeft])
                .padding(0.05),
            y: scaleLinear()
                .domain([0, 1])
                .range([chartGeom.height - chartGeom.spaceBottom, chartGeom.spaceTop])
        };

        drawAxes(svg, chartGeom, scales);
    
        /* bin the data using d3's `histogram()` */
        const toHistogram = histogram()
            .domain(scales.y.domain())
            .thresholds(violinResolution)
            .value((d) => d)
        const dataBinned = slicedData.map((d) => {
            return {refName: d.refName, binned: toHistogram(d.similarities)};
        });

        /* the maximum number of entries in any one bin. Needed to calculate violin width scale */
        const maxBinCount = dataBinned
            .map((d) => d.binned.reduce((pv, cv) => cv.length > pv ? cv.length : pv, 0))
            .reduce((pv, cv) => cv > pv ? cv : pv, 0);
        
        /* the scale for how wide bins are within the violin plot */
        scales.width = scaleLinear()
            .domain([-maxBinCount, maxBinCount])
            .range([0, scales.x.bandwidth()]);

        const pathGenerator = area()
            .x0((dd) => scales.width(-dd.length))
            .x1((dd) => scales.width(dd.length))
            .y((dd) => scales.y(dd.x0)) // the `histogram()` function creates `x0` and `x1` properties
            .curve(curveCatmullRom)

        svg.selectAll("violin")
            .data(dataBinned)
            .enter()
            .append("g")
                .attr("transform", (d) => "translate(" + scales.x(d.refName) +" ,0)")
            .append("path")
                .style("stroke", "none")
                .style("fill", colour)
                .attr("d", (d) => pathGenerator(d.binned))
    }, [chartGeom, svgRef, colour, data])

    return (
        <div className={className} style={{width}} ref={containerRef}>
            <div className="chartTitle">
                {title}
            </div>
            {chartGeom ? (
                <svg ref={svgRef} height={chartGeom.height} width={chartGeom.width}/>
            ) : null}
            { renderProp ? renderProp : null }
        </div>
    )
}

export default RefSimilarity;


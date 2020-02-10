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

import React, { useState } from 'react';
import styled from 'styled-components';
import CoveragePlot from "../Charts/Coverage";
import ReadsOverTime from "../Charts/ReadsOverTime";
import ReadsPerSample from "../Charts/ReadsPerSample";
import ReferenceHeatmap from "../Charts/ReferenceHeatmap";
import { ChartContainer, ExpandIconContainer } from "../SamplePanel/styles";
import { IoIosExpand, IoIosContract } from "react-icons/io";

const ExpandChart = ({handleClick}) => {
    return (
        <ExpandIconContainer onClick={handleClick}>
            <IoIosExpand onClick={handleClick}/>
        </ExpandIconContainer>
    )
};
const ContractChart = ({handleClick}) => {
    return (
        <ExpandIconContainer onClick={handleClick}>
            <IoIosContract onClick={handleClick}/>
        </ExpandIconContainer>
    )
};

const Container = styled.div`
    width: calc(100% - 30px);
    height: 350px;              /* adjusting will also adjust the graphs */
    min-height: 350px;          /* as they calculate via document selector query */
    margin: 10px 10px 0px 10px;
`;

/**
 * See <Panel> for why we use timeouts here
 */
const OverallSummaryPanel = ({combinedData, dataPerSample, config, goToSamplePanel}) => {

    /* -----------    STATE MANAGEMENT    ------------------- */
    const [chartToDisplay, setChartToDisplay] = useState(false);
    const [transitionInProgress, setTransitionInProgress] = useState(false);
    const goToChart = (chartName, duration=0) => {
        setTransitionInProgress(true);
        setChartToDisplay(chartName);
        setTimeout(() => setTransitionInProgress(false), duration);
    };


    /* -------------- DATA TRANSFORMS ----------------- */
    // TODO -- this is temporary to get colours working on the server
    const sampleColours = {};
    config.run.samples.forEach((d) => {sampleColours[d.name] = d.colour || "#FFFFFF"});
    Object.keys(dataPerSample).forEach((name) => {if (!sampleColours[name]) {sampleColours[name] = "#FFFFFF"}});

    /* ----------------- C H A R T S ----------------------- */
    const charts = {
        coverage: (
            <CoveragePlot
                width={chartToDisplay === "coverage" ? "85%" : "35%"}
                canShowReferenceMatches={false}
                coverage={dataPerSample}
                sampleColours={sampleColours}
                key="cov"
                config={config}
                renderProp={ chartToDisplay === "coverage" ?
                    (<ContractChart handleClick={() => goToChart(false)}/>) :
                    (<ExpandChart handleClick={() => goToChart("coverage")}/>)
                }
            />
        ),
        readsOverTime: (
            <ReadsOverTime
                width={chartToDisplay === "readsOverTime" ? "85%" : "22%"}
                title={"Mapped reads over time"}
                temporalData={combinedData.temporal}
                key="readsOverTime"
                config={config}
                renderProp={ chartToDisplay === "readsOverTime" ?
                    (<ContractChart handleClick={() => goToChart(false)}/>) :
                    (<ExpandChart handleClick={() => goToChart("readsOverTime")}/>)
                }
            />
        ),
        readsPerSample: (
            <ReadsPerSample
                width={chartToDisplay === "readsPerSample" ? "85%" : "18%"}
                title="Mapped Reads / Sample"
                data={dataPerSample}
                config={config}
                sampleColours={sampleColours}
                key="readsPerSample"
                goToSamplePanel={goToSamplePanel}
                renderProp={ chartToDisplay === "readsPerSample" ?
                    (<ContractChart handleClick={() => goToChart(false)}/>) :
                    (<ExpandChart handleClick={() => goToChart("readsPerSample")}/>)
                }
            />
        ),
        referenceHeatmap: (
            <ReferenceHeatmap
                width={chartToDisplay === "referenceHeatmap" ? "85%" : "25%"}
                title={config.display.relativeReferenceMapping ? "Relative Reference Matches" : "Reference Matches"}
                data={dataPerSample}
                config={config}
                referencePanel={config.genome.referencePanel}
                key="refHeatmap"
                renderProp={ chartToDisplay === "referenceHeatmap" ?
                    (<ContractChart handleClick={() => goToChart(false)}/>) :
                    (<ExpandChart handleClick={() => goToChart("referenceHeatmap")}/>)
                }
            />
        )
    };

    const renderGraphs = () => {
        if (chartToDisplay) {
            return [
                charts[chartToDisplay],
            ];
        }
        const els = [];
        els.push(charts.coverage);
        if (combinedData.temporal.length > 1) {
            els.push(charts.readsOverTime);
        }
        if (Object.keys(dataPerSample).length > 1) {
            els.push(charts.readsPerSample);
        }
        els.push(charts.referenceHeatmap);
        return els;
    };

    /* ----------------- R E N D E R ---------------- */
    return (
        <Container>
            <ChartContainer>
                {transitionInProgress ? null : renderGraphs()}
            </ChartContainer>
        </Container>
    )
};

export default OverallSummaryPanel;

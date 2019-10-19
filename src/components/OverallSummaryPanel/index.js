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
import CoveragePlot from "../Coverage";
import ReadsOverTime from "../ReadsOverTime";
import ReadsPerSample from "../ReadsPerSample";
import ReferenceHeatmap from "../ReferenceHeatmap";
import { IoIosExpand, IoIosContract } from "react-icons/io";

const ExpandChart = ({handleClick}) => {
  return (
    <div className="chartExpandContractIcon" onClick={handleClick}>
      <IoIosExpand onClick={handleClick}/>
    </div>
  )
};
const ContractChart = ({handleClick}) => {
  return (
    <div className="chartExpandContractIcon" onClick={handleClick}>
      <IoIosContract onClick={handleClick}/>
    </div>
  )
};

/**
 * See <Panel> for why we use timeouts here
 */
const OverallSummaryPanel = ({combinedData, dataPerSample, viewOptions, config}) => {

  /* -----------    STATE MANAGEMENT    ------------------- */
  const [chartToDisplay, setChartToDisplay] = useState(false);
  const [transitionInProgress, setTransitionInProgress] = useState(false);
  const goToChart = (chartName, duration=0) => {
    setTransitionInProgress(true);
    setChartToDisplay(chartName);
    setTimeout(() => setTransitionInProgress(false), duration);
  };


  /* ----------------- C H A R T S ----------------------- */
   const charts = {
    coverage: (
      <CoveragePlot
        className="graphContainer"
        width={chartToDisplay === "coverage" ? "85%" : "35%"}
        canShowReferenceMatches={false}
        coverage={dataPerSample}
        sampleColours={viewOptions.sampleColours}
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
        className="graphContainer"
        width={chartToDisplay === "readsOverTime" ? "85%" : "22%"}
        title={"Mapped reads over time"}
        temporalData={combinedData.temporal}
        viewOptions={viewOptions}
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
        className="graphContainer"
        width={chartToDisplay === "readsPerSample" ? "85%" : "18%"}
        title="Mapped Reads / Sample"
        data={dataPerSample}
        config={config}
        viewOptions={viewOptions}
        key="readsPerSample"
        renderProp={ chartToDisplay === "readsPerSample" ? 
          (<ContractChart handleClick={() => goToChart(false)}/>) :
          (<ExpandChart handleClick={() => goToChart("readsPerSample")}/>)
        }
      />
    ),
    referenceHeatmap: (
      <ReferenceHeatmap
        className="graphContainer"
        width={chartToDisplay === "referenceHeatmap" ? "85%" : "25%"}
        title="Reference Matches"
        data={dataPerSample}
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
    if (combinedData.temporal.length > 1) els.push(charts.readsOverTime);
    els.push(charts.readsPerSample);
    els.push(charts.referenceHeatmap);
    return els;
  };

  /* ----------------- R E N D E R ---------------- */
  return (
    <div id="overallSummaryContainer">
      <div className="panelFlexRow">
        {transitionInProgress ? null : renderGraphs()}
      </div>
    </div>
  )
};

export default OverallSummaryPanel;

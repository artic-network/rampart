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
}
const ContractChart = ({handleClick}) => {
  return (
    <div className="chartExpandContractIcon" onClick={handleClick}>
      <IoIosContract onClick={handleClick}/>
    </div>
  )
}

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
  }


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
  }

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
  }

  /* ----------------- R E N D E R ---------------- */
  return (
    <div id="overallSummaryContainer">
      <div className="panelFlexRow">
        {transitionInProgress ? null : renderGraphs()}
      </div>
    </div>
  )
}

export default OverallSummaryPanel;

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

import React, {useState, useEffect} from 'react';
import CoveragePlot from "../Charts/Coverage";
import ReadLengthDistribution from "../Charts/ReadLengthDistribution";
import CoverageOverTime from "../Charts/CoverageOverTime";
import SimpleFrequencyHist from "../Charts/SimpleFrequencyHist";
// import RefSimilarity from "../Charts/RefSimilarity";
import InfoRow from "./infoRow";
import { getPostProcessingMenuItems, PostProcessingRunner } from "./postProcessing";
import { IoIosExpand, IoIosContract } from "react-icons/io";
import { TimerContext } from "../App";
import SamplePanelContainer, {
  ChartContainer, ExpandIconContainer, SupplementaryChartContainer
} from "./styles";

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

/**
 * A panel representing an individual sample
 */
const SamplePanel = ({sampleName, sampleData, config, reference, socket, panelExpanded, setPanelExpanded}) => {

  /* -----------    STATE MANAGEMENT    ------------------- */
  const [showSinglePanel, setShowSinglePanel] = useState(false);
  const [transitionInProgress, setTransitionInProgress] = useState(false);
  const [postProcessingState, setPostProcessingState] = useState(false);
  const [showSupCharts, setShowSupCharts] = useState(false);
  
  /* When the parent tells us to expand / contract the panel, we want to trigger a transition. Why?
   *    The charts, upon initial rendering, calculate the SVG dimentions from the DOM they're in.
   *    Therefore we can't render them until after the CSS transitions have happened.
   *    It also helps when we change the size of them (e.g. expand) them to simply get
   *    them to reinitialise with new dimensions
   */
  useEffect(() => {
    const duration = 600; /* CSS transition is 0.5s */
    setTransitionInProgress(true);
    setTimeout(() => setTransitionInProgress(false), duration);
  }, [panelExpanded]);

  const goToChart = (chartName, duration=0) => {
    setTransitionInProgress(true);
    setShowSinglePanel(chartName);
    setTimeout(() => setTransitionInProgress(false), duration);
  };

  /* -------------- DATA TRANSFORMS ----------------- */
  const coverageData = {};
  const mapQualData = {};
  coverageData[sampleName] = sampleData;
  const sampleConfig = config.run.samples.filter((d) => d.name === sampleName).shift();
  const sampleColour = sampleConfig ? sampleConfig.colour : "#FFFFFF";
  const sampleColours = {}; /* dataformat needed by <CoveragePlot> */
  sampleColours[sampleName] = sampleColour;

  /* ------------- MENU OPTIONS -------------------- */
  const menuItems = [];
  menuItems.push(...getPostProcessingMenuItems(config, setPostProcessingState));

  /* ----------------- C H A R T S ----------------------- */
  const charts = {
    coverage: (
      <CoveragePlot
        width={(showSinglePanel === "coverage") ? "100%" : "40%"}
        canShowReferenceMatches={true}
        coverage={coverageData}
        referenceStream={sampleData.refMatchCoveragesStream}
        sampleColours={sampleColours}
        fillIn={true}
        config={config}
        key="coveragePlot"
        renderProp={ showSinglePanel === "coverage" ?
            (<ContractChart handleClick={() => goToChart(false)}/>) :
            (<ExpandChart handleClick={() => goToChart("coverage")}/>)
        }
      />
    ),
    readLength: (
      <ReadLengthDistribution
        title={"Read Lengths"}
        width={(showSinglePanel === "readLength") ? "100%" : "25%"}
        xyValues={sampleData.readLengths.xyValues}
        xyValuesMapped={sampleData.readLengthsMapped.xyValues}
        colour={sampleColour}
        config={config}
        key="readLengths"
        renderProp={ showSinglePanel === "readLength" ?
            (<ContractChart handleClick={() => goToChart(false)}/>) :
            (<ExpandChart handleClick={() => goToChart("readLength")}/>)
        }
      />
    ),
    coverageOverTime: (
      <CoverageOverTime
        width={(showSinglePanel === "coverageOverTime") ? "100%" : "30%"}
        className="graphContainer"
        temporalData={sampleData.temporal}
        colour={sampleColour}
        config={config}
        key="coverageOverTime"
        renderProp={ showSinglePanel === "coverageOverTime" ?
            (<ContractChart handleClick={() => goToChart(false)}/>) :
            (<ExpandChart handleClick={() => goToChart("coverageOverTime")}/>)
        }
      />
    ),/*,
    refSimilarity: (
        <RefSimilarity
            title={"Read mapping similarities"}
            width={(showSinglePanel === "refSimilarity") ? "100%" : "50%"}
            key="refSimilarity"
            colour={sampleColour}
            data={Object.keys(sampleData.refMatchSimilarities).map(
                (refName) => ({refName, similarities: sampleData.refMatchSimilarities[refName]})
            )}
            renderProp={ showSinglePanel === "refSimilarity" ?
                (<ContractChart handleClick={() => goToChart(false)}/>) :
                (<ExpandChart handleClick={() => goToChart("refSimilarity")}/>)
        }
        />
    )*/
    mapQual: (
      <SimpleFrequencyHist
        width={(showSinglePanel === "mapQual") ? "100%" : "30%"}
        data={coverageData}
        scaleFactor={0.1}
        attrName="mapQual"
        title="Mapping Quality"
        xLabel="QScore"
        sampleColours={sampleColours}
        fillIn={true}
        config={config}
        key="mapQualPlot"
        renderProp={ showSinglePanel === "mapQual" ?
            (<ContractChart handleClick={() => goToChart(false)}/>) :
            (<ExpandChart handleClick={() => goToChart("mapQual")}/>)
        }
      />
    ),
    meanQual: (
      <SimpleFrequencyHist
        width={(showSinglePanel === "meanQual") ? "100%" : "30%"}
        data={coverageData}
        scaleFactor={0.1}
        attrName="meanQual"
        title="Mean Quality"
        xLabel="QScore"
        sampleColours={sampleColours}
        fillIn={true}
        config={config}
        key="meanQualPlot"
        renderProp={ showSinglePanel === "meanQual" ?
            (<ContractChart handleClick={() => goToChart(false)}/>) :
            (<ExpandChart handleClick={() => goToChart("meanQual")}/>)
        }
      />
    ),
    identity: (
      <SimpleFrequencyHist
        width={(showSinglePanel === "identity") ? "100%" : "30%"}
        data={coverageData}
        attrName="identity"
        title="Identity"
        xLabel="% Identity"
        sampleColours={sampleColours}
        fillIn={true}
        config={config}
        key="identityPlot"
        renderProp={ showSinglePanel === "identity" ?
            (<ContractChart handleClick={() => goToChart(false)}/>) :
            (<ExpandChart handleClick={() => goToChart("identity")}/>)
        }
      />
    ),
    refCov: (
      <SimpleFrequencyHist
        width={(showSinglePanel === "refCov") ? "100%" : "30%"}
        data={coverageData}
        attrName="refCov"
        title="Reference coverage"
        xLabel="% Cov"
        sampleColours={sampleColours}
        fillIn={true}
        config={config}
        key="refCovPlot"
        renderProp={ showSinglePanel === "refCov" ?
            (<ContractChart handleClick={() => goToChart(false)}/>) :
            (<ExpandChart handleClick={() => goToChart("refCov")}/>)
        }
      />
    ),
    readCov: (
      <SimpleFrequencyHist
        width={(showSinglePanel === "readCov") ? "100%" : "30%"}
        data={coverageData}
        attrName="readCov"
        title="Read coverage"
        xLabel="% Cov"
        sampleColours={sampleColours}
        fillIn={true}
        config={config}
        key="refCovPlot"
        renderProp={ showSinglePanel === "readCov" ?
            (<ContractChart handleClick={() => goToChart(false)}/>) :
            (<ExpandChart handleClick={() => goToChart("readCov")}/>)
        }
      />
    ),
    alnBlockLen: (
      <SimpleFrequencyHist
        width={(showSinglePanel === "alnBlockLen") ? "100%" : "30%"}
        data={coverageData}
        attrName="alnBlockLen"
        title="Aligned block length"
        xLabel="Length (bp)"
        sampleColours={sampleColours}
        fillIn={true}
        config={config}
        key="alnBlockLenPlot"
        renderProp={ showSinglePanel === "alnBlockLen" ?
            (<ContractChart handleClick={() => goToChart(false)}/>) :
            (<ExpandChart handleClick={() => goToChart("alnBlockLen")}/>)
        }
      />
    ),
    readAln: (
      <SimpleFrequencyHist
        width={(showSinglePanel === "readAln") ? "100%" : "30%"}
        data={coverageData}
        attrName="readAln"
        title="Read alignment length"
        xLabel="Length (bp)"
        sampleColours={sampleColours}
        fillIn={true}
        config={config}
        key="readAlnPlot"
        renderProp={ showSinglePanel === "readAln" ?
            (<ContractChart handleClick={() => goToChart(false)}/>) :
            (<ExpandChart handleClick={() => goToChart("readAln")}/>)
        }
      />
    ),
    leftClip: (
      <SimpleFrequencyHist
        width={(showSinglePanel === "leftClip") ? "100%" : "30%"}
        data={coverageData}
        attrName="leftClip"
        title="Left clip"
        xLabel="Length (bp)"
        sampleColours={sampleColours}
        fillIn={true}
        config={config}
        key="leftClipPlot"
        renderProp={ showSinglePanel === "leftClip" ?
            (<ContractChart handleClick={() => goToChart(false)}/>) :
            (<ExpandChart handleClick={() => goToChart("leftClip")}/>)
        }
      />
    ),
    rightClip: (
      <SimpleFrequencyHist
        width={(showSinglePanel === "rightClip") ? "100%" : "30%"}
        data={coverageData}
        attrName="rightClip"
        title="Right clip"
        xLabel="Length (bp)"
        sampleColours={sampleColours}
        fillIn={true}
        config={config}
        key="rightClipPlot"
        renderProp={ showSinglePanel === "rightClip" ?
            (<ContractChart handleClick={() => goToChart(false)}/>) :
            (<ExpandChart handleClick={() => goToChart("rightClip")}/>)
        }
      />
    )
  };

  /* ---------------   WHAT CHARTS DO WE RENDER?   -------------- */
  const renderCharts = () => {
    if (!panelExpanded) return null;
    const chartsToShow = showSinglePanel ?
    charts[showSinglePanel] :
    [charts.coverage, charts.readLength, charts.coverageOverTime, charts.refSimilarity];
    return (
    <ChartContainer>
        {chartsToShow}
    </ChartContainer>
    )
  };

  /* ---------------   WHAT SUP CHARTS DO WE RENDER?   -------------- */
  const renderSupCharts = () => {
    if (!panelExpanded) return null;
    const chartsToShow = showSinglePanel ?
    charts[showSinglePanel] :
    [charts.mapQual, charts.meanQual, charts.identity, charts.refCov,
     charts.readCov, charts.alnBlockLen, charts.readAln, charts.leftClip,
      charts.rightClip];
    return (
    <ChartContainer>
        {chartsToShow}
    </ChartContainer>
    )
  };


  /* ----------------- R E N D E R ---------------- */
  return (
    <SamplePanelContainer
      panelExpanded={panelExpanded}
      showSupCharts={showSupCharts}
      sampleColour={sampleColour}
    > 
      <TimerContext.Consumer>
        {(timeSinceLastDataUpdate) => (
          <InfoRow
            sampleName={sampleName}
            sampleData={sampleData}
            sampleColour={sampleColour}
            menuItems={menuItems}
            handleClick={() => setPanelExpanded(sampleName, !panelExpanded)}
            isExpanded={panelExpanded}
            timeSinceLastDataUpdate={timeSinceLastDataUpdate}
          />
        )}
      </TimerContext.Consumer>

      {postProcessingState ? (
        <PostProcessingRunner
            pipeline={postProcessingState}
            sampleName={sampleName}
            socket={socket}
            dismissModal={() => setPostProcessingState(false)}
        />
      ) : null}
      {transitionInProgress ? null : renderCharts()}

      <SupplementaryChartContainer
        sampleColour={sampleColour}
      >
        <button
          type="button"
          onClick={() => setShowSupCharts(!showSupCharts)}>
          {
            showSupCharts
            ? ('Hide supplementary charts')
            : ('Show supplementary charts')
          }
        </button>
        {transitionInProgress || !showSupCharts ? null : renderSupCharts()}
      </SupplementaryChartContainer>

    </SamplePanelContainer>
  );
};

export default SamplePanel;

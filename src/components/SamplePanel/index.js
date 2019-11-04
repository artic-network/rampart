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

import React, {useState} from 'react';
import CoveragePlot from "../Coverage";
import ReadLengthDistribution from "../ReadLengthDistribution";
import CoverageOverTime from "../CoverageOverTime";
import InfoRow from "./infoRow";
// import SaveDemuxedReads from "./saveDemuxedReadsModal";
import { getPostProcessingMenuItems, PostProcessingRunner } from "./postProcessing";
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
 * Why are we using this transition / setTimeout stuff?
 *    The charts, upon initial rendering, calculate the SVG dimentions from the DOM they're in.
 *    Therefore we can't render them until after the CSS transitions have happened.
 *    It also helps when we change the size of them (e.g. expand) them to simply get
 *    them to reinitialise with new dimensions
 */
const SamplePanel = ({sampleName, sampleData, sampleColour, config, viewOptions, reference, socket, timeSinceLastDataUpdate}) => {

  /* -----------    STATE MANAGEMENT    ------------------- */
  const [expanded, setExpanded] = useState(true);
  const [singleRow, setSingleRow] = useState(true);
  const [showSinglePanel, setShowSinglePanel] = useState(false);
  const [transitionInProgress, setTransitionInProgress] = useState(false);
  const [postProcessingState, setPostProcessingState] = useState(false);
  const transitionStarted = (duration=600) => { /* CSS transition is 0.5s */
    setTransitionInProgress(true);
    setTimeout(() => setTransitionInProgress(false), duration);
  }
  const toggleExpanded = () => {
    transitionStarted();
    setExpanded(!expanded);
  }

  const goToChart = (chartName, duration=0) => {
    setTransitionInProgress(true);
    setShowSinglePanel(chartName);
    setTimeout(() => setTransitionInProgress(false), duration);
  };

  /* -------------- DATA TRANSFORMS ----------------- */
  const coverageData = {};
  coverageData[sampleName] = sampleData;


  /* ------------- MENU OPTIONS -------------------- */
  const menuItems = [];
  // if (!expanded) {
  //   menuItems.push({label: "Expand panel", callback: toggleExpanded})
  // } else {
  //   menuItems.push({label: "Contract panel", callback: toggleExpanded})
  //   if (singleRow) {
  //     if (showSinglePanel === false) {
  //       menuItems.push({label: "Expand Coverage", callback: () => {transitionStarted(0); setShowSinglePanel("coverage")}});
  //       menuItems.push({label: "Expand Read Lengths", callback: () => {transitionStarted(0); setShowSinglePanel("readLength")}});
  //       menuItems.push({label: "Expand Coverage vs Time", callback: () => {transitionStarted(0); setShowSinglePanel("coverageOverTime")}});
  //     } else {
  //       menuItems.push({label: "Show All (horisontally)", callback: () => {transitionStarted(0); setShowSinglePanel(false)}});
  //     }
  //     menuItems.push({label: "Show All (vertically)", callback: () => {transitionStarted(); setShowSinglePanel(false); setSingleRow(false);}});
  //   } else {
  //     menuItems.push({label: "Show All (horisontally)", callback: () => {transitionStarted(); setShowSinglePanel(false); setSingleRow(true);}});
  //   }
    menuItems.push(...getPostProcessingMenuItems(config, setPostProcessingState));
  // }

  /* ----------------- C H A R T S ----------------------- */
  const charts = {
    coverage: (
      <CoveragePlot
        className="graphContainer"
        width={(showSinglePanel === "coverage" || !singleRow) ? "100%" : "40%"}
        canShowReferenceMatches={true}
        coverage={coverageData}
        referenceStream={sampleData.refMatchCoveragesStream}
        sampleColours={viewOptions.sampleColours}
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
        className="graphContainer"
        title={"Read Lengths"}
        width={(showSinglePanel === "readLength" || !singleRow) ? "100%" : "25%"}
        xyValues={sampleData.readLengths.xyValues}
        colour={sampleColour}
        config={config}
        viewOptions={viewOptions}
        key="readLengths"
        renderProp={ showSinglePanel === "readLength" ?
            (<ContractChart handleClick={() => goToChart(false)}/>) :
            (<ExpandChart handleClick={() => goToChart("readLength")}/>)
        }
      />
    ),
    coverageOverTime: (
      <CoverageOverTime
        title={"Coverage Progress"}
        width={(showSinglePanel === "coverageOverTime" || !singleRow) ? "100%" : "30%"}
        className="graphContainer"
        temporalData={sampleData.temporal}
        colour={sampleColour}
        viewOptions={viewOptions}
        key="coverageOverTime"
        renderProp={ showSinglePanel === "coverageOverTime" ?
            (<ContractChart handleClick={() => goToChart(false)}/>) :
            (<ExpandChart handleClick={() => goToChart("coverageOverTime")}/>)
        }
      />
    )
  };

  /* ---------------   WHAT CHARTS DO WE RENDER?   -------------- */
  const renderCharts = () => {
    if (!expanded) return null;
    if (singleRow) {
      const chartsToShow = showSinglePanel ?
        charts[showSinglePanel] :
        [charts.coverage, charts.readLength, charts.coverageOverTime];
      return (
        <div className="panelFlexRow">
          {chartsToShow}
        </div>
      )
    }
    /* multi row! */
    return (
      <div className="panelFlexColumn">
        <div className="panelFlexRow">
          {charts.coverage}
        </div>
        <div className="panelFlexRow">
          {charts.readLength}
        </div>
        <div className="panelFlexRow">
          {charts.coverageOverTime}
        </div>
      </div>
    );
  };

  /* ----------------- R E N D E R ---------------- */
  return (
    <div
      className={`panelContainer ${expanded ? "expanded" : "collapsed"} ${singleRow ? "singleRow" : "multiRow"}`}
      style={{borderColor: sampleColour}}
    >
      <InfoRow
        sampleName={sampleName}
        sampleData={sampleData}
        sampleColour={sampleColour}
        menuItems={menuItems}
        handleClick={toggleExpanded}
        isExpanded={expanded}
        timeSinceLastDataUpdate={timeSinceLastDataUpdate}
      />
      {postProcessingState ? (
        <PostProcessingRunner
            pipeline={postProcessingState}
            sampleName={sampleName}
            socket={socket}
            dismissModal={() => setPostProcessingState(false)}
        />
      ) : null}
      {transitionInProgress ? null : renderCharts()}
    </div>
  );
};

export default SamplePanel;

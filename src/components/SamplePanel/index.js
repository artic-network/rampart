import React, {useState} from 'react';
import CoveragePlot from "../Coverage";
import ReadLengthDistribution from "../ReadLengthDistribution";
import CoverageOverTime from "../CoverageOverTime";
import InfoRow from "./infoRow";

/**
 * Why are we using this transition / setTimeout stuff?
 *    The charts, upon initial rendering, calculate the SVG dimentions etc.
 *    Therefore we can't render them until after the CSS transitions have happened.
 *    It also helps when we change the size of them (e.g. expand) them to simply get
 *    them to reinitialise with new dimensions
 */
const Panel = ({sampleName, sampleData, sampleColour, viewOptions, reference, canExpand}) => {

  /* -----------    STATE MANAGEMENT    ------------------- */
  const [expanded, setExpanded] = useState(false);
  const [singleRow, setSingleRow] = useState(true);
  const [showSinglePanel, setShowSinglePanel] = useState(false);
  const [transitionInProgress, setTransitionInProgress] = useState(false);
  const transitionStarted = (duration=600) => { /* CSS transition is 0.5s */
    setTransitionInProgress(true);
    setTimeout(() => setTransitionInProgress(false), duration);
  }
  const toggleExpanded = () => {
    transitionStarted();
    setExpanded(!expanded);
  }

  /* -------------- DATA TRANSFORMS ----------------- */
  const coverageData = {};
  coverageData[sampleName] = sampleData;


  /* ------------- MENU OPTIONS -------------------- */
  const menuItems = [];
  if (singleRow) {
    if (showSinglePanel === false) {
      menuItems.push({label: "Expand Coverage", callback: () => {transitionStarted(0); setShowSinglePanel("coverage")}});
      menuItems.push({label: "Expand Read Lengths", callback: () => {transitionStarted(0); setShowSinglePanel("readLength")}});
      menuItems.push({label: "Expand Coverage vs Time", callback: () => {transitionStarted(0); setShowSinglePanel("coverageOverTime")}});
    } else {
      menuItems.push({label: "Show All (horisontally)", callback: () => {transitionStarted(0); setShowSinglePanel(false)}});
    }
    menuItems.push({label: "Show All (vertically)", callback: () => {transitionStarted(); setShowSinglePanel(false); setSingleRow(false);}});
  } else {
    menuItems.push({label: "Show All (horisontally)", callback: () => {transitionStarted(); setShowSinglePanel(false); setSingleRow(true);}});
  }


  /* ----------------- C H A R T S ----------------------- */
  const charts = {
    coverage: (
      <CoveragePlot
        className="graphContainer"
        width={(showSinglePanel === "coverage" || !singleRow) ? "100%" : "40%"}
        showReferenceMatches={true}
        data={coverageData}
        reference={reference}
        viewOptions={viewOptions}
        fillIn={true}
        key="coveragePlot"
      />
    ),
    readLength: (
      <ReadLengthDistribution
        className="graphContainer"
        title={"Read Lengths"}
        width={(showSinglePanel === "readLength" || !singleRow) ? "100%" : "25%"}
        xyValues={sampleData.readLengths.xyValues}
        colour={sampleColour}
        viewOptions={viewOptions}
        key="readLengths"
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
      />
    )
  };

  if (sampleName === "abc") {
    console.log(sampleName, sampleColour, sampleData)
  }
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
  }

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
        enableUserInteraction={canExpand}
        menuItems={menuItems}
        handleClick={toggleExpanded}
        isExpanded={expanded}
      />
      {transitionInProgress ? null : renderCharts()}
    </div>
  );
}

export default Panel;

import React, {useState} from 'react';
import CoveragePlot from "../Coverage";
import ReadLengthDistribution from "../ReadLengthDistribution";
import CoverageOverTime from "../CoverageOverTime";
import InfoRow from "./infoRow";
import SaveDemuxedReads from "./saveDemuxedReadsModal";

/**
 * Why are we using this transition / setTimeout stuff?
 *    The charts, upon initial rendering, calculate the SVG dimentions from the DOM they're in.
 *    Therefore we can't render them until after the CSS transitions have happened.
 *    It also helps when we change the size of them (e.g. expand) them to simply get
 *    them to reinitialise with new dimensions
 */
const Panel = ({sampleName, sampleData, sampleColour, config, viewOptions, reference, canExpand, socket}) => {

  /* -----------    STATE MANAGEMENT    ------------------- */
  const [expanded, setExpanded] = useState(false);
  const [singleRow, setSingleRow] = useState(true);
  const [showSinglePanel, setShowSinglePanel] = useState(false);
  const [transitionInProgress, setTransitionInProgress] = useState(false);
  const [showModal, setShowModal] = useState(false);
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
  if (!expanded) {
    menuItems.push({label: "Expand panel", callback: toggleExpanded})
  } else {
    menuItems.push({label: "Contract panel", callback: toggleExpanded})
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
    menuItems.push({label: "Save Demuxed Reads", callback: () => {setShowModal("saveReads")}})
  }


  /* ----------------- C H A R T S ----------------------- */
  const charts = {
    coverage: (
      <CoveragePlot
        className="graphContainer"
        width={(showSinglePanel === "coverage" || !singleRow) ? "100%" : "40%"}
        canShowReferenceMatches={true}
        coverage={coverageData}
        referenceStream={sampleData.refMatchesAcrossGenome}
        referencePanel={config.referencePanel}
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

  /* -------------- DO WE WANT TO RENDER A MODAL? -------------- */
  const renderModal = () => {
    if (showModal === "saveReads") {
      return (
        <SaveDemuxedReads
          sampleName={sampleName}
          referenceNames={sampleData.referencePanelNames}
          dismissModal={() => setShowModal(false)}
          socket={socket}
          config={config}
        />
      )
    }
    return null
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
      {renderModal()}
      {transitionInProgress ? null : renderCharts()}
    </div>
  );
}

export default Panel;

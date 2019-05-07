import React, {useState} from 'react';
import CoveragePlot from "./Coverage";
import ReadLengthDistribution from "./ReadLengthDistribution";
import CoverageOverTime from "./CoverageOverTime";
import {select} from "d3-selection";
import {consensusCoverage, okCoverage} from "../magics";
import {heatColourScale} from "../utils/colours";

/**
 * the info row is both when collapsed and when open
 */
const InfoRow = ({sampleName, sampleData, handleClick, isExpanded, canExpand}) => {
  const summaryTitle = `${sampleName}`;
  const summaryText = `${sampleData.demuxedCount} reads demuxed, ${sampleData.mappedCount} mapped.`;
  return (
    <div className="infoRow" onClick={() => {if (canExpand) {handleClick();}}}>
      <span style={{flexBasis: "15%"}}>{summaryTitle}</span>
      <span>{summaryText}</span>
      { canExpand ? (
        <span className="toggle">
          {isExpanded ? "click to contract" : "click to expand"}
        </span>
      ) : <span/>}
    </div>
  );
};

const Panel = ({sampleName, sampleData, sampleColour, viewOptions, reference, canExpand}) => {
  const [expanded, setExpanded] = useState(true);
  const coverageData = {};
  coverageData[sampleName] = sampleData;
  return (
    <div
      className={`panelContainer ${expanded ? "expanded" : "collapsed"}`}
      style={{borderColor: sampleColour}}
    >
      <InfoRow sampleName={sampleName} sampleData={sampleData} handleClick={() => setExpanded(!expanded)} isExpanded={expanded} canExpand={canExpand}/>

      {
        expanded ? (
          <div className="panelFlexRow">
            <CoveragePlot
              className="graphContainer"
              width="45%"
              showReferenceMatches={true}
              data={coverageData}
              reference={reference}
              viewOptions={viewOptions}
              fillIn={true}
            />

            <CoverageOverTime
              title={"Coverage Progress"}
              width="30%"
              className="graphContainer"
              temporalData={sampleData.temporal}
              colour={sampleColour}
              viewOptions={viewOptions}
            />
          </div>
        ) : null
      }

    </div>
  )

}

export default Panel;

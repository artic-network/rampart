import React, {useState} from 'react';
import ReactDOM from 'react-dom';
import CoveragePlot from "./Coverage";
import ReadLengthDistribution from "./ReadLengthDistribution";
import CoverageOverTime from "./CoverageOverTime";
import {select} from "d3-selection";
import {consensusCoverage, okCoverage} from "../magics";
import {heatColourScale} from "../utils/colours";
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import { MdReorder } from "react-icons/md";
import { IoIosArrowDropdownCircle, IoIosArrowDropupCircle } from "react-icons/io";
import { IconContext } from "react-icons";


const Blah = ({portalId, expandCoverage}) => {
  return (
    ReactDOM.createPortal((
      <div>
        <ContextMenu id={portalId} hideOnLeave={true}>
          <MenuItem data={{foo: 'bar'}} onClick={() => console.log("CLICK")}>
            Expand this panel
          </MenuItem>
          <MenuItem data={{foo: 'bar'}} onClick={() => console.log("CLICK")}>
            Make panel full screen
          </MenuItem>
          <MenuItem data={{foo: 'bar'}} onClick={expandCoverage}>
            Expand Coverage!!!!!
          </MenuItem>
        </ContextMenu>
      </div>
      ), document.querySelector(`#contextMenuPortal`)
    )
  )
}

/**
 * the info row is both when collapsed and when open
 */
const InfoRow = ({sampleName, sampleData, sampleColour, handleClick, isExpanded, canExpand, expandCoverage}) => {
  const summaryTitle = `${sampleName}`;
  const summaryText = `${sampleData.demuxedCount} reads demuxed, ${sampleData.mappedCount} mapped.`;
  // onClick={}
  const togglePanelExpand = () => {
    if (canExpand) handleClick();
  }

  // console.log("***", document.querySelector(`#contextMenuPortal`))
  // ReactDOM.createPortal((
  //   <div>
  //     <ContextMenu id={`panelRightClickMenu-${sampleName}`} hideOnLeave={true}>
  //       <MenuItem data={{foo: 'bar'}} onClick={() => console.log("CLICK")}>
  //         Expand this panel
  //       </MenuItem>
  //       <MenuItem data={{foo: 'bar'}} onClick={() => console.log("CLICK")}>
  //         Make panel full screen
  //       </MenuItem>
  //       <MenuItem data={{foo: 'bar'}} onClick={() => console.log("CLICK")}>
  //         Save demuxed reads to a folder (TODO)
  //       </MenuItem>
  //     </ContextMenu>
  //   </div>
  //   ), document.querySelector(`#contextMenuPortal`)
  // );


  return (
    <div className="infoRow">
      <div>
        <IconContext.Provider value={{color: sampleColour}}>
          { isExpanded ? (
            <IoIosArrowDropupCircle className="icon120 clickable" onClick={togglePanelExpand} />
          ) : (
            <IoIosArrowDropdownCircle className="icon120 clickable" onClick={togglePanelExpand} />
          )}
        </IconContext.Provider>
        <span>{summaryTitle}</span>
      </div>

      <span>{summaryText}</span>

      <ContextMenuTrigger id={`panelRightClickMenu-${sampleName}`} holdToDisplay={0}>
        <MdReorder className="icon150 iconCenterVertically clickable"/>
      </ContextMenuTrigger>
      <Blah portalId={`panelRightClickMenu-${sampleName}`} expandCoverage={expandCoverage}/>

    </div>
  );
};

const Panel = ({sampleName, sampleData, sampleColour, viewOptions, reference, canExpand}) => {
  const [expanded, setExpanded] = useState(false);

  const [covFull, setCovFull] = useState(false);
  const expandCoverage = () => setCovFull(!covFull);

  const coverageData = {};
  coverageData[sampleName] = sampleData;
  
  
  const coverage = (
    <CoveragePlot
      className="graphContainer"
      width={covFull ? "100%" : "45%"}
      showReferenceMatches={true}
      data={coverageData}
      reference={reference}
      viewOptions={viewOptions}
      fillIn={true}
    />
  );

  const readLength = (
    <ReadLengthDistribution
      className="graphContainer"
      title={"Read Lengths"}
      width="20%"
      xyValues={sampleData.readLengths.xyValues}
      colour={sampleColour}
      viewOptions={viewOptions}
    />
  );

  const coverageOverTime = (
    <CoverageOverTime
      title={"Coverage Progress"}
      width="30%"
      className="graphContainer"
      temporalData={sampleData.temporal}
      colour={sampleColour}
      viewOptions={viewOptions}
    />
  )
  
  
  return (
    <div
      className={`panelContainer ${expanded ? "expanded" : "collapsed"}`}
      style={{borderColor: sampleColour}}
    >
      <InfoRow sampleName={sampleName} sampleData={sampleData} sampleColour={sampleColour} handleClick={() => setExpanded(!expanded)} isExpanded={expanded} canExpand={canExpand} expandCoverage={expandCoverage}/>

      {
        expanded ? (
          <div className="panelFlexRow">
            { covFull ? (
              [coverage]
            ) : (
              [coverage, readLength, coverageOverTime]
            )}
          </div>
        ) : null
      }

    </div>
  )

}

export default Panel;

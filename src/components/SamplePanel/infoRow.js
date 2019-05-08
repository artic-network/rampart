import React from 'react';
import { ContextMenuTrigger } from "react-contextmenu";
import { MdReorder } from "react-icons/md";
import { IoIosArrowDropdownCircle, IoIosArrowDropupCircle } from "react-icons/io";
import { IconContext } from "react-icons";
import Menu from "./menu";

/* the icon on the far left which opens the panel */
const TriggerPanelExpand = ({sampleColour, isExpanded, handleClick}) => {
  return (
    <IconContext.Provider value={{color: sampleColour}}>
      { isExpanded ? (
        <IoIosArrowDropupCircle className="icon120 clickable" onClick={handleClick} />
      ) : (
        <IoIosArrowDropdownCircle className="icon120 clickable" onClick={handleClick} />
      )}
    </IconContext.Provider>
  );
}

/**
 * InfoRow -- the thin line of text / icons at the top of a sample panel
 * the info row is rendered when the panel is collapsed and when open
 */
const InfoRow = ({sampleName, sampleData, sampleColour, enableUserInteraction, menuItems, handleClick, isExpanded}) => {
  const summaryTitle = `${sampleName}`;
  const summaryText = `${sampleData.demuxedCount} reads demuxed, ${sampleData.mappedCount} mapped.`;

  return (
    <div className="infoRow">
      <div>
          {enableUserInteraction ? (
            <TriggerPanelExpand isExpanded={isExpanded} handleClick={handleClick} sampleColour={sampleColour}/>
          ) : null
          }
        <span>{summaryTitle}</span>
      </div>

      <span>{summaryText}</span>

      {isExpanded ? (
        <div>
          <ContextMenuTrigger id={`panelRightClickMenu-${sampleName}`} holdToDisplay={0}>
            <MdReorder className="icon150 iconCenterVertically clickable"/>
          </ContextMenuTrigger>
          <Menu id={`panelRightClickMenu-${sampleName}`} items={menuItems}/>
        </div>
      ) : (
        <div/>
      )}

    </div>
  );
};


export default InfoRow;
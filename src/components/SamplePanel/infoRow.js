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

import React from 'react';
import { ContextMenuTrigger } from "react-contextmenu";
import { MdReorder } from "react-icons/md";
import { IoIosArrowDropdownCircle, IoIosArrowDropupCircle } from "react-icons/io";
import { IconContext } from "react-icons";
import Menu from "./menu";
import {makeTimeFormatter} from "../../utils/commonFunctions";

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
const InfoRow = ({sampleName, sampleData, sampleColour, menuItems, handleClick, isExpanded}) => {
    const summaryTitle = `${sampleName}`;
    const timeFormatter = makeTimeFormatter();

    const summaryText = `${sampleData.mappedCount} reads mapped | ` +
        `${sampleData.temporal.length > 0 ? Math.round(sampleData.temporal[sampleData.temporal.length - 1].mappedRate) : "N/A"} reads/sec | ` +
        `read last seen ${timeFormatter(sampleData.readsLastSeen)} ago`;

    return (
        <div className="infoRow" style={{color: sampleColour}}>
            <div>
                <TriggerPanelExpand isExpanded={isExpanded} handleClick={handleClick} sampleColour={sampleColour}/>
                <span style={{whiteSpace: "nowrap"}}>{summaryTitle}</span>
            </div>

            <span style={{whiteSpace: "nowrap"}}>{summaryText}</span>

            <div>
                <ContextMenuTrigger id={`panelRightClickMenu-${sampleName}`} holdToDisplay={0}>
                    <IconContext.Provider value={{color: sampleColour}}>
                        <MdReorder className="icon150 iconCenterVertically clickable" style={{paddingTop: "3px"}}/>
                    </IconContext.Provider>
                </ContextMenuTrigger>
                <Menu id={`panelRightClickMenu-${sampleName}`} items={menuItems}/>
            </div>

        </div>
    );
};


export default InfoRow;
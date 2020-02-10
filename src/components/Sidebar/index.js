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
import { IoIosCloseCircle, IoMdSettings, IoIosOptions, IoMdToday } from "react-icons/io";
import Config from "./Config";
import Report from "./Report";
// import ViewOptions from "./ViewOptions";
import Filters from "./Filters";
import Container from "./styles";
import ModernButton from "../reusable/ModernButton";

/**
 * React component to render & control a sidebar which transitions
 * in from the right hand side.
 */
const SidebarContainer = ({title, open, onChange, children, idx}) => {
    if (!children) {
        return (
            <Container className="closed"/>
        )
    }
    return (
        <Container className="open">
            <div className="inner">
                <ModernButton className="topRight" onClick={onChange}>
                    <div><IoIosCloseCircle/><span>close sidebar</span></div>
                </ModernButton>
                {children}
                <div style={{minHeight: "50px"}}/>
            </div>
        </Container>
    )
};

export const sidebarButtonNames = [
    {label: (<div><IoMdSettings/><span>config</span></div>), value: "config"},
    // {label: (<div><IoIosOptions/><span>settings</span></div>), value: "viewOptions"},
    {label: (<div><IoIosOptions/><span>filters</span></div>), value: "readFilters"},
    {label: (<div><IoMdToday/><span>report</span></div>), value: "report"}
]

const Sidebar = ({config, setConfig, combinedData, dataPerSample, sidebarOpen, setSidebarOpenState}) => {
    const sidebars = {
      config: (<Config config={config} setConfig={setConfig} closeSidebar={() => setSidebarOpenState(undefined)}/>),
    //   viewOptions: (<ViewOptions config={config} setConfig={setConfig} viewOptions={viewOptions} />), // TODO
      report: (<Report dataPerSample={dataPerSample} config={config}/>),
      readFilters: (<Filters config={config} setConfig={setConfig} closeSidebar={() => setSidebarOpenState(undefined)} dataPerSample={dataPerSample} combinedData={combinedData} />)
    };


    return (
        <SidebarContainer onChange={() => setSidebarOpenState(undefined)}>
            {sidebarOpen ? sidebars[sidebarOpen] : null}
        </SidebarContainer>
    )
}

export default Sidebar;
  
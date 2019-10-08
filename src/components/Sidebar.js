import React from 'react';
import { IoIosCloseCircle, IoMdSettings, IoIosOptions, IoMdToday } from "react-icons/io";
import Config from "./config";
import Report from "./Report";
import ViewOptions from "./viewOptions";

/**
 * React component to render & control a sidebar which transitions
 * in from the right hand side.
 */
const SidebarContainer = ({title, open, onChange, children, idx}) => {
    if (!children) {
        return (
            <div className="sidebar closed"/>
        )
    }
    return (
        <div className="sidebar open">
            <div className="inner">
            <button className="modernButton topRight" onClick={onChange}>
                <div><IoIosCloseCircle/><span>close sidebar</span></div>
            </button>
            {children}
            <div style={{minHeight: "50px"}}/>
            </div>
        </div>
    )
};

export const sidebarButtonNames = [
    {label: (<div><IoMdSettings/><span>config</span></div>), value: "config"},
    {label: (<div><IoIosOptions/><span>settings</span></div>), value: "viewOptions"},
    {label: (<div><IoMdToday/><span>report</span></div>), value: "report"}
]

const Sidebar = ({config, setConfig, combinedData, dataPerSample, viewOptions, setViewOptions, sidebarOpen, setSidebarOpenState}) => {


    const sidebars = {
      config: (<Config config={config} setConfig={setConfig} closeSidebar={() => setSidebarOpenState(undefined)}/>),
      viewOptions: (<ViewOptions config={config} setConfig={setConfig} viewOptions={viewOptions} setViewOptions={setViewOptions}/>),
      report: (<Report dataPerSample={dataPerSample} combinedData={combinedData} config={config}/>)
    };


    return (
        <SidebarContainer onChange={() => setSidebarOpenState(undefined)}>
            {sidebarOpen ? sidebars[sidebarOpen] : null}
        </SidebarContainer>
    )
}

export default Sidebar;
  
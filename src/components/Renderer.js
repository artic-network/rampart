import React, {useState} from 'react';
import PropTypes from "prop-types";
import Header from "./Header";
import Footer from "./Footer";
import Panel from "./SamplePanel"
import '../styles/rampart.css';
import { css } from 'glamor'
import OverallSummary from "./overallSummary";
import ChooseBasecalledDirectory from "./ChooseBasecalledDirectory";
import Config from "./config";
import Report from "./Report";
import ViewOptions from "./viewOptions";
import { IoMdSettings, IoIosOptions, IoMdToday, IoIosCloseCircle } from "react-icons/io";

const container = css({
  display: "flex",
  'flexDirection': 'column',
  overflowX: "hidden"
})

const RenderPanels = ({dataPerSample, combinedData, viewOptions, config, openConfigSidebar, socket}) => {
  if (!dataPerSample || !combinedData) {
    return (
      <h1>????</h1>
    );
  }
  const elements = [];
  /* we want to render the "overall" progress in a special panel */

  const mappingDataAvailable = config.reference && config.referencePanel.length;

  if (mappingDataAvailable) {
    elements.push(
      <OverallSummary
        viewOptions={viewOptions}
        combinedData={combinedData}
        dataPerSample={dataPerSample}
        reference={config.reference}
        referencePanel={config.referencePanel}
        key={"overall"}
      />
    );
  } else {
    elements.push(
      <div key="msg" className="centerHorizontally">
        <h3 style={{maxWidth: "50vw"}}>
          {`Please specify mapping references via config panel, without these we cannot display nice things!`}
        </h3>
        <button className="modernButton" onClick={openConfigSidebar}>
          <div><IoMdSettings/><span>open config</span></div>
        </button>
      </div>
    )
  }


  /* For each sample name we want to render a panel */
  Object.keys(dataPerSample).forEach((name) => {
    elements.push(
      <Panel
        sampleName={name}
        sampleData={dataPerSample[name]}
        sampleColour={viewOptions.sampleColours[name]}
        key={name}
        viewOptions={viewOptions}
        reference={config.reference}
        canExpand={mappingDataAvailable}
        socket={socket}
      />
    );
  })
  return elements;
}

/**
 * React component to render & control a sidebar which transitions
 * in from the right hand side.
 */
const Sidebar = ({title, open, onChange, children, idx}) => {
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
}

const Renderer = (props) => {
  const [sidebarOpen, setSidebarOpenState] = useState(false);


  const sidebars = {
    config: (<Config config={props.config} setConfig={props.setConfig} socket={props.socket} closeSidebar={() => setSidebarOpenState(undefined)}/>),
    viewOptions: (<ViewOptions viewOptions={props.viewOptions} setViewOptions={props.setViewOptions}/>),
    report: (<Report dataPerSample={props.dataPerSample} combinedData={props.combinedData} config={props.config}/>)
  };
  const sidebarButtonNames = [
    {label: (<div><IoMdSettings/><span>config</span></div>), value: "config"},
    {label: (<div><IoIosOptions/><span>settings</span></div>), value: "viewOptions"},
    {label: (<div><IoMdToday/><span>report</span></div>), value: "report"}
  ]
  
  return (
    <div {...container}>
      <Header
        viewOptions={props.viewOptions}
        setViewOptions={props.setViewOptions}
        config={props.config}
        sidebarButtonNames={sidebarButtonNames}
        sidebarOpenCB={setSidebarOpenState}
        combinedData={props.combinedData}
      />
      {
        props.mainPage === "chooseBasecalledDirectory" ?
          <ChooseBasecalledDirectory socket={props.socket} changePage={props.changePage}/> :
          props.mainPage === "loading" ?
            <h1>LOADING</h1> :
            <RenderPanels dataPerSample={props.dataPerSample} combinedData={props.combinedData} viewOptions={props.viewOptions} config={props.config} openConfigSidebar={() => setSidebarOpenState("config")} socket={props.socket}/>
      }

      <div id="contextMenuPortal"/>

      <Footer/>
      <Sidebar onChange={() => setSidebarOpenState(undefined)}>
        {sidebarOpen ? sidebars[sidebarOpen] : null}
      </Sidebar>

      <div id="modalPortal"/>
    </div>
  )
}


Renderer.propTypes = {
  dataPerSample: PropTypes.object,
  combinedData: PropTypes.object,
  config: PropTypes.object,
  setConfig: PropTypes.func.isRequired,
  socket: PropTypes.object.isRequired
};


export default Renderer;


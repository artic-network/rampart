import React, {useState} from 'react';
import PropTypes from "prop-types";
import Header from "./Header";
import Footer from "./Footer";
import Panel from "./Panel"
import '../styles/global'; // sets global CSS
import '../styles/fonts.css'; // sets global fonts
import '../styles/rampart.css';
import { css } from 'glamor'
import OverallSummary from "./OverallSummary";
import { sum } from "d3-array";
import ChooseBasecalledDirectory from "./ChooseBasecalledDirectory";
import Config from "./Config";
import { hidden } from 'ansi-colors';
// import SidebarManager from "./Sidebar";
import Report from "./Report";
import ViewOptions from "./ViewOptions";

const container = css({
  display: "flex",
  'flexDirection': 'column',
  overflowX: "hidden"
})

// const renderOverallSummary = (props) => (
//   <OverallSummary
//     samples={props.samples}
//     readsOverTime={props.readsOverTime}
//     annotation={props.annotation}
//     references={props.references}
//     coveragePerSample={props.coveragePerSample}
//     readCountPerSample={props.readCountPerSample}
//     refMatchPerSample={props.refMatchPerSample}
//     version={props.dataVersion}
//     sampleColours={props.sampleColours}
//     viewOptions={props.viewOptions}
//   />
// )

// const renderPanel = (props, sampleName, sampleIdx) => (
//   <Panel
//     key={sampleName}
//     readCount={props.readCountPerSample[sampleIdx]}
//     version={props.dataVersion}
//     annotation={props.annotation}
//     coverage={props.coveragePerSample[sampleIdx]}
//     readLength={props.readLengthPerSample[sampleIdx]}
//     references={props.references}
//     refMatchCounts={props.refMatchPerSample[sampleIdx]}
//     referenceMatchAcrossGenome={props.referenceMatchAcrossGenome[sampleIdx]}
//     name={sampleName}
//     sampleIdx={sampleIdx}
//     numSamples={props.samples.length}
//     coverageOverTime={props.coverageOverTime[sampleIdx]}
//     colour={props.sampleColours[sampleIdx]}
//     referenceColours={props.referenceColours}
//     viewOptions={props.viewOptions}
//   />
// )

const RenderPanels = ({data, viewOptions, config, openConfigSidebar}) => {
  if (!data) {
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
        data={data}
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
          Open config panel
        </button>
      </div>
    )
  }


  /* For each sample name we want to render a panel */
  Object.keys(data).forEach((name) => {
    if (name === "all") return;
    elements.push(
      <Panel
        sampleName={name}
        sampleData={data[name]}
        sampleColour={viewOptions.sampleColours[name]}
        key={name}
        viewOptions={viewOptions}
        reference={config.reference}
        canExpand={mappingDataAvailable}
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
        <button className="modernButton" onClick={onChange}>close sidebar</button>
        {children}
        <div style={{minHeight: "50px"}}/>
      </div>
    </div>
  )
}

const Renderer = (props) => {
  const [sidebarOpen, setSidebarOpenState] = useState("undefined");


  const sidebars = {
    config: (<Config config={props.config} setConfig={props.setConfig} socket={props.socket} closeSidebar={() => setSidebarOpenState(undefined)}/>),
    vizSettings: (<ViewOptions viewOptions={props.viewOptions}/>),
    report: (<Report data={props.data} config={props.config}/>)
  };

  return (
    <div {...container}>
      <Header
        viewOptions={props.viewOptions}
        setViewOptions={props.setViewOptions}
        config={props.config}
        sidebarButtonNames={Object.keys(sidebars)}
        sidebarOpenCB={setSidebarOpenState}
        data={props.data ? props.data.all : undefined}
      />
      {
        props.mainPage === "chooseBasecalledDirectory" ?
          <ChooseBasecalledDirectory socket={props.socket} changePage={props.changePage}/> :
          props.mainPage === "loading" ?
            <h1>LOADING</h1> :
            <RenderPanels data={props.data} viewOptions={props.viewOptions} config={props.config} openConfigSidebar={() => setSidebarOpenState("config")}/>
      }
      <Footer/>
      <Sidebar onChange={() => setSidebarOpenState(undefined)}>
        {sidebarOpen ? sidebars[sidebarOpen] : null}
      </Sidebar>
    </div>
  )
}


Renderer.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
  setConfig: PropTypes.func.isRequired,
  socket: PropTypes.object.isRequired
};


export default Renderer;


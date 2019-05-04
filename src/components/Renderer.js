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

const container = css({
  display: "flex",
  'flexDirection': 'column',
  overflowX: "hidden"
})

const renderHeader = (props) => (
  <Header
    status={props.status}
    name={props.config ? props.config.title : "unknown"}
    runTime={props.readsOverTime && props.readsOverTime.length ? props.readsOverTime[props.readsOverTime.length-1][0] : 0}
    numReads={props.readCountPerSample ? sum(props.readCountPerSample) : 0}
    nFastqs={props.nFastqs}
    numSamples={props.samples ? props.samples.length : 0}
    timeLastReadsReceived={props.timeLastReadsReceived}
    setViewOptions={props.setViewOptions}
    viewOptions={props.viewOptions}
    sidebarButtonNames={props.sidebarButtonNames}
    sidebarOpenCB={props.sidebarOpenCB}
  />
);

const renderOverallSummary = (props) => (
  <OverallSummary
    samples={props.samples}
    readsOverTime={props.readsOverTime}
    annotation={props.annotation}
    references={props.references}
    coveragePerSample={props.coveragePerSample}
    readCountPerSample={props.readCountPerSample}
    refMatchPerSample={props.refMatchPerSample}
    version={props.dataVersion}
    sampleColours={props.sampleColours}
    viewOptions={props.viewOptions}
  />
)

const renderPanel = (props, sampleName, sampleIdx) => (
  <Panel
    key={sampleName}
    readCount={props.readCountPerSample[sampleIdx]}
    version={props.dataVersion}
    annotation={props.annotation}
    coverage={props.coveragePerSample[sampleIdx]}
    readLength={props.readLengthPerSample[sampleIdx]}
    references={props.references}
    refMatchCounts={props.refMatchPerSample[sampleIdx]}
    referenceMatchAcrossGenome={props.referenceMatchAcrossGenome[sampleIdx]}
    name={sampleName}
    sampleIdx={sampleIdx}
    numSamples={props.samples.length}
    coverageOverTime={props.coverageOverTime[sampleIdx]}
    colour={props.sampleColours[sampleIdx]}
    referenceColours={props.referenceColours}
    viewOptions={props.viewOptions}
  />
)

const DataDisplay = (props) => {
  if (!props.data) {
    return (
      <h1>????</h1>
    );
  }
  return Object.keys(props.data).map((name) => {
    return (
      <h3 key={name}>{`${name}: ${props.data[name].demuxedCount} reads demuxed, ${props.data[name].mappedCount} mapped.`}</h3>
    )
  });
}

// const _calcSidebarInitialState = (sidebars) => {
//   const initialState = {};
//   sidebars.forEach((arr) => initialState[arr[0]] = false)
//   return initialState;
// }
// const _sidebarReducer = (state, action) => {
//   state[action.name] = !state[action.name];
//   /* check we don't have multiple ones open! */
//   if (state[action.name]) {
//     Object.keys(state)
//       .filter((n) => n !== action.name)
//       .forEach((sidebarName) => {
//         state[sidebarName] = false;
//       });
//   }
//   return Object.assign({}, state);
// }


// {/* <SidebarManager data={props.data} config={props.config} setConfig={props.setConfig} socket={props.socket} sidebarOpen={sidebarOpen}/> */}


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

  // const [sidebarOpen, dispatch] = useReducer(_reducer, sidebars, _calcInitialState);
  const [sidebarOpen, setState] = useState(undefined);

  const sidebars = {
    config: (<Config data={props.data} config={props.config} setConfig={props.setConfig} socket={props.socket}/>),
    vizSettings: (<h1 style={{width: "300px"}}>to do!</h1>),
    report: (<h1>report time</h1>)
  };

  const headerProps = {
    sidebarButtonNames: Object.keys(sidebars),
    sidebarOpenCB: setState,
    ...props
  }

  return (
    <div {...container}>
      <Sidebar onChange={() => setState(undefined)}>
        {sidebarOpen ? sidebars[sidebarOpen] : null}
      </Sidebar>

      {renderHeader(headerProps)}
      {
        props.mainPage === "chooseBasecalledDirectory" ?
          <ChooseBasecalledDirectory/> :
          props.mainPage === "loading" ?
            <h1>LOADING</h1> :
            <DataDisplay {...props}/>
      }
    </div>
  )


}


Renderer.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
  setConfig: PropTypes.func.isRequired,
  socket: PropTypes.func.isRequired
};


export default Renderer;


  // return (
  //   <div {...container}>
  //     {renderHeader(props)}
  //     {props.dataVersion ? (
  //       <div>
  //         {/*renderOverallSummary(props)*/}
  //         {props.samples.map((sampleName, sampleIdx) => 
  //           renderPanel(props, sampleName, sampleIdx)
  //         )}
  //       </div>
  //     ) : null
  //   }
  //     <Footer/>
  //   </div>
  // )
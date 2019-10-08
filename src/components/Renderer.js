import React, {useState} from 'react';
import PropTypes from "prop-types";
import Header from "./Header";
import Footer from "./Footer";
import '../styles/rampart.css';
import ChooseBasecalledDirectory from "./ChooseBasecalledDirectory";
import Modal from "./modal";
import Sidebar, {sidebarButtonNames} from "./Sidebar/index";
import Panels from "./Panels";

const Renderer = (props) => {
    const [sidebarOpen, setSidebarOpenState] = useState(false);

    const renderMainPage = () => {
        if (props.mainPage === "chooseBasecalledDirectory") {
            return (
                <ChooseBasecalledDirectory socket={props.socket} changePage={props.changePage}/>
            );
        } else if (props.mainPage === "loading") {
            return (
                <h1>LOADING</h1>
            );
        }
        return (
            <Panels
                dataPerSample={props.dataPerSample}
                combinedData={props.combinedData}
                viewOptions={props.viewOptions}
                config={props.config}
                openConfigSidebar={() => setSidebarOpenState("config")}
                socket={props.socket}
            />
        )
    }
  
    return (
        <div className="mainContainer">
            <Header
                viewOptions={props.viewOptions}
                setViewOptions={props.setViewOptions}
                config={props.config}
                setConfig={props.setConfig}
                sidebarButtonNames={sidebarButtonNames}
                sidebarOpenCB={setSidebarOpenState}
                combinedData={props.combinedData}
                socket={props.socket}
                infoMessage={props.infoMessage}
            />

            {renderMainPage()}

            <div id="contextMenuPortal"/>

            <Footer/>
            <Sidebar 
                config={props.config}
                setConfig={props.setConfig}
                combinedData={props.combinedData}
                dataPerSample={props.dataPerSample}
                viewOptions={props.viewOptions}
                setViewOptions={props.setViewOptions}
                sidebarOpen={sidebarOpen}
                setSidebarOpenState={setSidebarOpenState}
            />

            {props.warningMessage ? (
                <Modal className="warning" dismissModal={props.clearWarningMessage}>
                    <h2>ERROR</h2>
                    <p>{props.warningMessage}</p>
                </Modal>
            ) : null}


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


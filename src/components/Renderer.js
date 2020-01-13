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

import React, {useState} from 'react';
import PropTypes from "prop-types";
import Header from "./Header";
import Footer from "./Footer";
import '../styles/rampart.css';
import 'rc-slider/assets/index.css';
import Modal from "./modal";
import Sidebar, {sidebarButtonNames} from "./Sidebar/index";
import PanelManager from "./PanelManager";

const Renderer = (props) => {
    const [sidebarOpen, setSidebarOpenState] = useState(false);
    return (
        <div className="mainContainer">
            <Header
                config={props.config}
                setConfig={props.setConfig}
                sidebarButtonNames={sidebarButtonNames}
                sidebarOpenCB={setSidebarOpenState}
                combinedData={props.combinedData}
                socket={props.socket}
                infoMessages={props.infoMessages}
            />

            {props.mainPage === "loading" ?
                (<h1>LOADING</h1>) :
                (<PanelManager
                        dataPerSample={props.dataPerSample}
                        combinedData={props.combinedData}
                        config={props.config}
                        openConfigSidebar={() => setSidebarOpenState("config")}
                        socket={props.socket}
                        timeSinceLastDataUpdate={props.timeSinceLastDataUpdate}
                />)
            }

            <div id="contextMenuPortal"/>

            <Footer/>
            <Sidebar 
                config={props.config}
                setConfig={props.setConfig}
                combinedData={props.combinedData}
                dataPerSample={props.dataPerSample}
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

/* UNUSED CODE: The following was a switch to enable the
    startup page where you could select the basecalled directory
    etc via the UI:
import ChooseBasecalledDirectory from "./ChooseBasecalledDirectory";

if (props.mainPage === "chooseBasecalledDirectory") {
    return (
        <ChooseBasecalledDirectory socket={props.socket} changePage={props.changePage}/>
    );
*/

Renderer.propTypes = {
  dataPerSample: PropTypes.object,
  combinedData: PropTypes.object,
  config: PropTypes.object,
  setConfig: PropTypes.func.isRequired,
  socket: PropTypes.object.isRequired
};


export default Renderer;


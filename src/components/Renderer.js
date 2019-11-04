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
                timeSinceLastDataUpdate={props.timeSinceLastDataUpdate}
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


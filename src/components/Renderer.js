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
import PropTypes from "prop-types";
import { ThemeProvider } from 'styled-components';
import { GlobalStyle, palette, AppContainer } from "../styles";
import Header from "./Header";
import Footer from "./Footer";
import "../styles/fonts.css";
import 'rc-slider/assets/index.css';
import Modal from "./modal";
import Sidebar, {sidebarButtonNames} from "./Sidebar";
import PanelManager from "./PanelManager/index.js";

class Renderer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sidebarOpen: false,
            // currently storing light vs dark theme as a state variable, but could explore other
            // solutions such as localStorage -- https://css-tricks.com/a-dark-mode-toggle-with-react-and-themeprovider/
            lightMode: false
        }
        this.setSidebarOpenState = (newValue) => {
            this.setState({sidebarOpen: newValue});
        }
        this.toggleTheme = () => {
            this.setState({lightMode: !this.state.lightMode});
        }
    }
    shouldComponentUpdate(nextProps, nextState) {
        if (this.state !== nextState) return true;
        /* we don't want to update when the only state that's changed
        is the counter `timeSinceLastDataUpdate` */
        return !!Object.keys(nextProps)
          .filter((k) => k!=="timeSinceLastDataUpdate")
          .filter((k) => nextProps[k] !== this.props[k])
          .length;
    }
    render() {
        return (
            <ThemeProvider theme={{...palette, lightMode: this.state.lightMode}}>
                <GlobalStyle/>
                <AppContainer>
                    <Header
                        config={this.props.config}
                        setConfig={this.props.setConfig}
                        sidebarButtonNames={sidebarButtonNames}
                        sidebarOpenCB={this.setSidebarOpenState}
                        combinedData={this.props.combinedData}
                        socket={this.props.socket}
                        infoMessages={this.props.infoMessages}
                        lightMode={this.state.lightMode}
                        toggleTheme={this.toggleTheme}
                    />

                    {this.props.mainPage === "loading" ?
                        (<h1>LOADING</h1>) :
                        (<PanelManager
                                dataPerSample={this.props.dataPerSample}
                                combinedData={this.props.combinedData}
                                config={this.props.config}
                                openConfigSidebar={() => this.setSidebarOpenState("config")}
                                socket={this.props.socket}
                        />)
                    }
                    <div id="contextMenuPortal"/>


                    <Footer/>
                    <Sidebar 
                        config={this.props.config}
                        setConfig={this.props.setConfig}
                        combinedData={this.props.combinedData}
                        dataPerSample={this.props.dataPerSample}
                        sidebarOpen={this.state.sidebarOpen}
                        setSidebarOpenState={this.setSidebarOpenState}
                    />

                    {this.props.warningMessage ? (
                        <Modal className="warning" dismissModal={this.props.clearWarningMessage}>
                            <h2>ERROR</h2>
                            <p>{this.props.warningMessage}</p>
                        </Modal>
                    ) : null}


                    <div id="modalPortal"/>
                </AppContainer>
            </ThemeProvider>
        )
    }
}

/* UNUSED CODE: The following was a switch to enable the
    startup page where you could select the basecalled directory
    etc via the UI:
import ChooseBasecalledDirectory from "./ChooseBasecalledDirectory";

if (this.props.mainPage === "chooseBasecalledDirectory") {
    return (
        <ChooseBasecalledDirectory socket={this.props.socket} changePage={this.props.changePage}/>
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


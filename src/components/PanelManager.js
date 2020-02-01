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

import React, { useState, useRef, useEffect } from 'react';
// import PropTypes from "prop-types";
import SamplePanel from "./SamplePanel"
import OverallSummaryPanel from "./OverallSummaryPanel";
import { isEqual } from "lodash";

const PanelManager = ({dataPerSample, combinedData, config, openConfigSidebar, socket}) => {
    
    /* -----------    STATE MANAGEMENT    ------------------- */
    const [samplePanelsExpanded, setSamplePanelsExpanded] = useState({});

    useEffect(() => {
        document.addEventListener("keydown", (event) => {
            if (event.keyCode === 67 || event.keyCode === 79) { // 'c' or 'o' => close all or open all
                setSamplePanelsExpanded((prevState) => {
                    const newState = {...prevState};
                    Object.keys(newState).forEach((k) => newState[k] = event.keyCode === 79);
                    return newState;
                });
            }
        });
    }, []);

    const refs = useRef(new Map());
    const setPanelExpanded = (panelName, newState) => {
        const state = {...samplePanelsExpanded};
        state[panelName] = newState;
        setSamplePanelsExpanded(state);
    };
    const goToSamplePanel = (panelName) => {
        if (!samplePanelsExpanded[panelName]) setPanelExpanded(panelName, true);
        window.scrollTo({left: 0, top: refs.current.get(panelName).current.offsetTop, behavior: "smooth"});
    };
    /* If we have new panels (e.g. new sampleNames / barcodes discovered or defined) then set `samplePanelsExpanded`
     * An alternative approach would be to use `useEffect` here.
     */ 
    if (!isEqual(Object.keys(samplePanelsExpanded), Object.keys(dataPerSample))) {
        const state = {};
        Object.keys(dataPerSample).forEach((sampleName) => {
            state[sampleName] = true; // set to false to start with collapsed panels
            if (!refs.current.has(sampleName)) refs.current.set(sampleName, {current: null});
        });
        setSamplePanelsExpanded(state);
    }

    if (!dataPerSample || !combinedData) {
        return (
            <h1>????</h1>
        );
    }

    /* ----------------- R E N D E R ---------------- */
    return (
        <>
            <OverallSummaryPanel
                combinedData={combinedData}
                dataPerSample={dataPerSample}
                key={"overall"}
                config={config}
                goToSamplePanel={goToSamplePanel}
            />
            {Object.keys(dataPerSample).map((name) => (
                <div key={name} ref={refs.current.get(name)}>
                    <SamplePanel
                        sampleName={name}
                        sampleData={dataPerSample[name]}
                        panelExpanded={samplePanelsExpanded[name]}
                        setPanelExpanded={setPanelExpanded}
                        reference={config.reference}
                        socket={socket}
                        config={config}
                    />
                </div>
            ))}
        </>
    )
};


export default PanelManager;

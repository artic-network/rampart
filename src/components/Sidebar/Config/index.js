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

import React, {useRef, useState, useReducer} from 'react';
import PropTypes from "prop-types";
import Select from "react-select";
import { IoIosSave } from "react-icons/io";
import BarcodeNames from "./BarcodeNames";

const SaveConfig = ({handleClick}) => (
    <button className="modernButton" onClick={handleClick}>
        <div><IoIosSave/><span>save config</span></div>
    </button>
)

const Config = ({config, setConfig, closeSidebar}) => {
    /* since changing config is done on the server (the client just displays
     * it) we want to maintain a temporary copy here, and then flush it to the server */
    const [configCopy, dispatch] = useReducer(reducer, JSON.parse(JSON.stringify(config)));

    if (!Object.keys(config).length) {
        // should do this in the parent!
        return (
            <p>Can't display config before we get one from the server!</p>
        );
    }

    const submit = () => {
        console.log("Sending Config To Server. Barcode names:", configCopy.run.barcodeNames);
        setConfig({config: configCopy});
        closeSidebar();
    }

    return (
        <div className="config" onDrop={(e) => {e.preventDefault()}}>

            <h1>Set Config</h1>

            <BarcodeNames
                barcodeNames={configCopy.run.barcodeNames}
                setBarcodeNames={(barcodeName, sampleName) => dispatch({type: "barcodeNames", barcodeName, sampleName})}
            />

            <SaveConfig handleClick={submit}/>

        </div>
    )

}

function reducer(state, action) {
    switch (action.type) {
        case 'barcodeNames':
            // iterate shallow copies for those parts of state which will change
            const newState = {...state, run: {...state.run, barcodeNames: {...state.run.barcodeNames}}};
            newState.run.barcodeNames[action.barcodeName].name = action.sampleName;
            return newState;
        default:
            console.error("ERROR: This reducer should not fallthrough.");
            return state;
    }
}

export default Config;

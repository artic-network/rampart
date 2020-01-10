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
import { IoIosSave } from "react-icons/io";
import BarcodeNames from "./BarcodeNames";
import { isEqual } from "lodash";

const SaveConfig = ({handleClick}) => (
    <button className="modernButton" onClick={handleClick}>
        <div><IoIosSave/><span>save config</span></div>
    </button>
)

const Config = ({config, setConfig, closeSidebar}) => {
    /* since changing config is done on the server (the client just displays
     * it) we want to maintain a temporary copy here, and then flush it to the server */
    const [barcodeNames, setBarcodeNames] = useState(JSON.parse(JSON.stringify(config.run.barcodeNames)));

    if (!Object.keys(config).length) {
        // should do this in the parent!
        return (
            <p>Can't display config before we get one from the server!</p>
        );
    }

    const submit = () => {
        const action = computeAction(config, barcodeNames);
        if (!action) {
            console.warn("Not sending config to server as there are no changes!")
            return;
        }
        console.log("Calling setConfig", action);
        setConfig(action);
        closeSidebar();
    }

    return (
        <div className="config" onDrop={(e) => {e.preventDefault()}}>

            <h1>Set Config</h1>

            <BarcodeNames barcodeNames={barcodeNames} setBarcodeNames={setBarcodeNames} />

            <SaveConfig handleClick={submit}/>

        </div>
    )

}

function computeAction(config, barcodeNames) {
    // what's changed? Do some diffs to then tell the server what parts of the config
    // have changed. This function should be developed in conjunction with `modifyConfig`
    // on the server side
    const action = {};
    if (!isEqual(config.run.barcodeNames, barcodeNames)) {
        action.barcodeNames = barcodeNames;
    }
    if (Object.keys(action).length) {
        return action;
    }
    return false;
}

export default Config;

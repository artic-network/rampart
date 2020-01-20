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
import Modal from "../modal";
import { IoMdPlay } from "react-icons/io";

const ChooseMinReadLength = ({userSettings, setUserSettings}) => (
    <>
        <h4>Minimum read length:</h4>
        <input type="text" value={userSettings.min_read_length} onChange={(e) => setUserSettings({...userSettings, min_read_length: e.target.value})}/>
    </>
);

const ChooseMaxReadLength = ({userSettings, setUserSettings}) => (
    <>
        <h4>Maximum read length:</h4>
        <input type="text" value={userSettings.max_read_length} onChange={(e) => setUserSettings({...userSettings, max_read_length: e.target.value})}/>
    </>
);


export const getPostProcessingMenuItems = (config, setPostProcessingState) => {
    return Object.keys(config.pipelines)
        .filter((key) => !!config.pipelines[key].processing) /* restrict to "processing" pipelines only */
        .filter((key) => config.pipelines[key].run_per_sample) /* restrict to those which are defined to be run per sample */
        .map((key) => ({
            label: config.pipelines[key].name,
            callback: () => setPostProcessingState(config.pipelines[key])
        }));
};

const createInitialState = (pipeline) => {
    console.log("creating initial state");
    const initialState = {};
    if (pipeline.options.min_read_length) initialState.min_read_length = 0; // TODO -- get min read length from dataset
    if (pipeline.options.max_read_length) initialState.max_read_length = 1000000; // TODO -- get max read length from dataset
    return initialState;
}

export const PostProcessingRunner = ({pipeline, dismissModal, socket, sampleName}) => {
    const [userSettings, setUserSettings] = useState(() => createInitialState(pipeline));

    const send = () => {
        console.log("triggerPostProcessing")
        socket.emit('triggerPostProcessing', {pipeline, sampleName, userSettings});
        dismissModal();
    };

    return (
        <Modal dismissModal={dismissModal}>
            <h2>{pipeline.name}</h2>
            {Object.keys(userSettings).length ? (
                <>
                    <h3>This pipeline requests the following options:</h3>
                    {(userSettings.min_read_length !== undefined) ? (
                        <ChooseMinReadLength userSettings={userSettings} setUserSettings={setUserSettings}/>
                    ) : null}
                    {(userSettings.max_read_length !== undefined) ? (
                        <ChooseMaxReadLength userSettings={userSettings} setUserSettings={setUserSettings}/>
                    ) : null}
                </>
            ) : null }
            <button className="modernButton" onClick={send}>
                <div><IoMdPlay/><span>TRIGGER</span></div>
            </button>
        </Modal>
    )
};

PostProcessingRunner.propTypes = {
    dismissModal: PropTypes.func.isRequired,
    sampleName: PropTypes.string.isRequired,
    pipeline: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]).isRequired,
    socket: PropTypes.object.isRequired
};

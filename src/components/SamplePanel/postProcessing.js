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
import Modal from "../modal";
import { IoMdPlay } from "react-icons/io";
import ModernButton from "../reusable/ModernButton";

export const getPostProcessingMenuItems = (config, setPostProcessingState) => {
    return Object.keys(config.pipelines)
        .filter((key) => !config.pipelines[key].ignore)
        .filter((key) => config.pipelines[key].run_per_sample) /* restrict to those which are defined to be run per sample */
        .map((key) => ({
            label: config.pipelines[key].name,
            callback: () => setPostProcessingState(config.pipelines[key])
        }));
};

export const PostProcessingRunner = ({pipeline, dismissModal, socket, sampleName}) => {

    const send = () => {
        console.log("triggerPostProcessing", pipeline.name, sampleName)
        socket.emit('triggerPostProcessing', {key: pipeline.key, sampleName});
        dismissModal();
    };

    return (
        <Modal dismissModal={dismissModal}>
            <h2>{pipeline.name}</h2>
            <ModernButton onClick={send}>
                <>
                    <IoMdPlay/>
                    <span>TRIGGER</span>
                </>
            </ModernButton>
        </Modal>
    )
};

PostProcessingRunner.propTypes = {
    dismissModal: PropTypes.func.isRequired,
    sampleName: PropTypes.string.isRequired,
    pipeline: PropTypes.object.isRequired,
    socket: PropTypes.object.isRequired
};

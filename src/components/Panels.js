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
// import PropTypes from "prop-types";
import SamplePanel from "./SamplePanel"
import OverallSummaryPanel from "./OverallSummaryPanel";

const Panels = ({dataPerSample, combinedData, viewOptions, config, openConfigSidebar, socket}) => {
    if (!dataPerSample || !combinedData) {
        return (
            <h1>????</h1>
        );
    }

    return (
        <>
            <OverallSummaryPanel
                viewOptions={viewOptions}
                combinedData={combinedData}
                dataPerSample={dataPerSample}
                key={"overall"}
                config={config}
            />
            {Object.keys(dataPerSample).map((name) => (
                <SamplePanel
                    sampleName={name}
                    sampleData={dataPerSample[name]}
                    sampleColour={viewOptions.sampleColours[name]}
                    key={name}
                    viewOptions={viewOptions}
                    reference={config.reference}
                    socket={socket}
                    config={config}
                />
            ))}
        </>
    )
}


export default Panels;

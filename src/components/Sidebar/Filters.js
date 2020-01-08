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

import React, { useReducer } from 'react';
// import Toggle from "../toggle";
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';

const Filters = ({config, setConfig, closeSidebar}) => {

    // When this Component loads, check the config for any filters already set and
    // set the internal state to mirror these
    const [state, dispatch] = useReducer(reducer, config, init);
    console.log("<Filters> internal state:", state)

    return (
        <div>
            <h2>Filter reads</h2>

            <p>Read Lengths</p>
            <div style={{width: 400, margin: "30px 20px 30px 20px"}}>
                <Slider.Range
                    allowCross={false}
                    marks={createRangeMarks(state.readLengthBoundsInData)}
                    min={state.readLengthBoundsInData[0]}
                    max={state.readLengthBoundsInData[1]}
                    step={config.display.readLengthResolution}
                    defaultValue={state.readLengthBounds}
                    onAfterChange={(data) => dispatch({type: 'readLengthBounds', data, setConfig})}
                    handle={sliderHandle}
                />
            </div>

            <button className="modernButton" onClick={() => dispatch({type: "reset", closeSidebar, setConfig})}>
                reset filters
            </button>
        </div>
    );

};

function init(config) {
    // TODO -- pass in data here to extract appropriate values
    if (!Object.keys(config).length) {
        console.log("FATAL -- THIS HAPPENS WHEN SERVER HASN'T SENT DATA YET")
        return {};
    }
    const readLengthBoundsInData = [0, 2000];

    return {
        readLengthBoundsInData,
        readLengthBounds: [
            config.display.filters.minReadLength || readLengthBoundsInData[0],
            config.display.filters.maxReadLength || readLengthBoundsInData[1]
        ]
    };
}

function reducer(state, action) {
    let newState;
    const filters = {}; // represents filter state for the server
    switch (action.type) {
        case 'readLengthBounds':
            newState = {...state, readLengthBounds: action.data};
            if (action.data[0] !== state.readLengthBoundsInData[0]) filters.minReadLength = action.data[0];
            if (action.data[1] !== state.readLengthBoundsInData[1]) filters.maxReadLength = action.data[1];
            break;
        case 'reset':
            /* instead of modifying state (and getting the slider to update appropriately)
            we just close the sidebar!
            By not modifying `filters` the server interprets this as "no filters set" */
            action.closeSidebar();
            break;
        default:
            console.error("ERROR: This reducer should not fallthrough.");
            return state;
    }

    console.log("Telling server to update!", filters);
    // Could (should) debounce this, as it's somewhat expensive & will appear laggy
    // As data updates on the server cannot be interrupted
    action.setConfig({filters});
    return newState;
}

function createRangeMarks(bounds) {
    const nMarks = 5;
    const step = (bounds[1]-bounds[0]) / (nMarks-1);
    const marks = {};
    for (let i=0; i<nMarks; i++) {
        marks[bounds[0]+step*i] = `${bounds[0]+step*i}bp`;
    }
    return marks;
}

function sliderHandle(props) {
    const { value, dragging, index, ...restProps } = props;
    return (
      <Tooltip
        prefixCls="rc-slider-tooltip"
        overlay={value}
        visible
        placement="top"
        key={index}
      >
        <Slider.Handle value={value} {...restProps} />
      </Tooltip>
    );
  };

export default Filters;
